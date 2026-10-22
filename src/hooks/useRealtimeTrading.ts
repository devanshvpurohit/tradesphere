'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
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

export function useRealtimeTrading(userId: string = 'demo-user-123') {
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

  return {
    balance,
    positions,
    userOrders,
    liveTrades,
    isConnected,
    lastSyncTime,
  };
}
