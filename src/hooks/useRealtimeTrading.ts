'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase/client';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  limit,
} from 'firebase/firestore';

export interface RealtimeTradeEvent {
  orderId?: string;
  symbol: string;
  side: 'BUY' | 'SELL' | 'SHORT' | 'COVER' | string;
  quantity: number;
  price: number;
  status?: string;
  productType?: string;
  realizedPnL?: number;
  timestamp: string;
}

export interface RealtimePositionItem {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  productType?: 'MIS' | 'CNC' | string;
  positionType?: 'LONG' | 'SHORT';
  updatedAt?: string;
}

export function useRealtimeTrading(customUserId?: string) {
  // Resolve active user: customUserId -> cookie/localStorage -> fallback 'demo-user-123'
  const userId =
    customUserId ||
    (typeof window !== 'undefined'
      ? document.cookie.match(/tradesphere_uid=([^;]+)/)?.[1] ||
        localStorage.getItem('tradesphere_demo_id') ||
        'demo-user-123'
      : 'demo-user-123');

  const [balance, setBalance] = useState<number>(100000);
  const [positions, setPositions] = useState<RealtimePositionItem[]>([]);
  const [userOrders, setUserOrders] = useState<RealtimeTradeEvent[]>([]);
  const [liveTrades, setLiveTrades] = useState<RealtimeTradeEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!db || typeof window === 'undefined') {
      setIsConnected(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    try {
      // 1. Realtime Listen to User Balance: users/{userId}
      const userDocRef = doc(db, 'users', userId);
      const unsubUser = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (typeof data?.balance === 'number') {
              setBalance(data.balance);
              setIsConnected(true);
              setLastSyncTime(new Date());
            }
          } else {
            // Auto-initialize account in Firestore with ₹1,00,000 virtual capital
            setDoc(
              userDocRef,
              {
                id: userId,
                email: `${userId}@tradesphere.app`,
                balance: 100000,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            ).catch(() => {});
          }
        },
        (error) => {
          console.warn('Firestore user balance listener warning:', error.message);
        }
      );
      unsubscribes.push(unsubUser);

      // 2. Realtime Listen to User Portfolio: portfolios where userId == userId
      const portfoliosQuery = query(
        collection(db, 'portfolios'),
        where('userId', '==', userId)
      );
      const unsubPortfolios = onSnapshot(
        portfoliosQuery,
        (snap) => {
          const list: RealtimePositionItem[] = snap.docs.map((d) => {
            const item = d.data();
            return {
              symbol: item.stockSymbol || item.symbol || '',
              quantity: item.quantity || 0,
              avgPrice: item.avgPrice || 0,
              currentPrice: item.currentPrice,
              productType: item.productType || 'MIS',
              positionType: item.positionType || (item.quantity < 0 ? 'SHORT' : 'LONG'),
              updatedAt: item.updatedAt || item.createdAt,
            };
          });
          setPositions(list.filter((p) => p.symbol && p.quantity !== 0));
          setIsConnected(true);
          setLastSyncTime(new Date());
        },
        (error) => {
          console.warn('Firestore portfolio listener warning:', error.message);
        }
      );
      unsubscribes.push(unsubPortfolios);

      // 3. Realtime Listen to User Orders: orders where userId == userId
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        limit(25)
      );
      const unsubOrders = onSnapshot(
        ordersQuery,
        (snap) => {
          const list: RealtimeTradeEvent[] = snap.docs.map((d) => {
            const item = d.data();
            return {
              orderId: d.id,
              symbol: item.stockSymbol || item.symbol || '',
              side: item.type || item.side || 'BUY',
              quantity: item.quantity || 0,
              price: item.executedPrice ?? item.price ?? 0,
              status: item.status || 'FILLED',
              productType: item.productType || 'MIS',
              realizedPnL: item.realizedPnL,
              timestamp: item.executedAt || item.createdAt || new Date().toISOString(),
            };
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setUserOrders(list);
          setIsConnected(true);
          setLastSyncTime(new Date());
        },
        (error) => {
          console.warn('Firestore orders listener warning:', error.message);
        }
      );
      unsubscribes.push(unsubOrders);

      // 4. Realtime Listen to Recent Transactions: transactions
      const txnsQuery = query(
        collection(db, 'transactions'),
        limit(20)
      );
      const unsubTxns = onSnapshot(
        txnsQuery,
        (snap) => {
          const list: RealtimeTradeEvent[] = snap.docs.map((d) => {
            const item = d.data();
            return {
              orderId: d.id,
              symbol: item.stockSymbol || '',
              side: item.type || 'BUY',
              quantity: item.quantity || 0,
              price: item.price || 0,
              productType: item.productType,
              timestamp: item.createdAt || new Date().toISOString(),
            };
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLiveTrades(list);
        },
        (error) => {
          console.warn('Firestore transactions listener warning:', error.message);
        }
      );
      unsubscribes.push(unsubTxns);
    } catch (err: any) {
      console.warn('Firestore realtime subscription setup error:', err?.message);
    }

    return () => {
      unsubscribes.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // ignore cleanup errors
        }
      });
    };
  }, [userId]);

  /**
   * Seed demo portfolio & orders directly to Firestore so the user can immediately see live data
   */
  const seedSampleData = useCallback(async () => {
    if (!db) return;
    const now = new Date().toISOString();

    const sampleHoldings = [
      { symbol: 'RELIANCE.NS', quantity: 15, avgPrice: 2940.50, currentPrice: 2985.20, positionType: 'LONG' as const, productType: 'CNC' },
      { symbol: 'TCS.NS', quantity: 10, avgPrice: 4120.00, currentPrice: 4190.50, positionType: 'LONG' as const, productType: 'CNC' },
      { symbol: 'INFY.NS', quantity: 20, avgPrice: 1780.00, currentPrice: 1815.00, positionType: 'LONG' as const, productType: 'CNC' },
      { symbol: 'HDFCBANK.NS', quantity: 25, avgPrice: 1650.00, currentPrice: 1682.00, positionType: 'LONG' as const, productType: 'MIS' },
    ];

    try {
      // 1. Ensure user account document exists
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: `${userId}@tradesphere.app`,
        balance: 78500,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });

      // 2. Write sample holdings to Firestore 'portfolios' collection
      for (const h of sampleHoldings) {
        const docId = `${userId}_${h.symbol}`;
        await setDoc(doc(db, 'portfolios', docId), {
          id: docId,
          userId,
          stockSymbol: h.symbol,
          quantity: h.quantity,
          avgPrice: h.avgPrice,
          currentPrice: h.currentPrice,
          positionType: h.positionType,
          productType: h.productType,
          createdAt: now,
          updatedAt: now,
        });

        // 3. Write corresponding execution orders
        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'orders', orderId), {
          id: orderId,
          userId,
          stockSymbol: h.symbol,
          type: 'BUY',
          quantity: h.quantity,
          price: h.avgPrice,
          executedPrice: h.avgPrice,
          status: 'EXECUTED',
          productType: h.productType,
          createdAt: now,
          executedAt: now,
        });

        // 4. Write transaction log
        const txnId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'transactions', txnId), {
          id: txnId,
          userId,
          stockSymbol: h.symbol,
          type: 'BUY',
          quantity: h.quantity,
          price: h.avgPrice,
          productType: h.productType,
          createdAt: now,
        });
      }
    } catch (err: any) {
      console.error('Failed to seed sample data to Firestore:', err);
      throw err;
    }
  }, [userId]);

  return {
    balance,
    positions,
    userOrders,
    liveTrades,
    isConnected,
    lastSyncTime,
    seedSampleData,
  };
}
