'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  const autoSeedAttempted = useRef(false);

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
          const validPositions = list.filter((p) => p.symbol && p.quantity !== 0);
          setPositions(validPositions);
          setIsConnected(true);
          setLastSyncTime(new Date());

          // If database is completely empty on first visit, auto-seed realistic trades & positions
          if (
            snap.docs.length === 0 &&
            !autoSeedAttempted.current &&
            typeof window !== 'undefined' &&
            localStorage.getItem('tradesphere_auto_seeded') !== 'true'
          ) {
            autoSeedAttempted.current = true;
            seedSampleData().catch(() => {});
          }
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
        limit(50)
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
        limit(50)
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
              productType: item.productType || 'MIS',
              realizedPnL: item.realizedPnL,
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
   * Seed demo portfolio, orders, and realized gains/losses directly to Firestore
   */
  const seedSampleData = useCallback(async () => {
    if (!db) return;
    const now = new Date();
    const isoNow = now.toISOString();

    // Balanced portfolio containing both GAINS and LOSSES
    const sampleHoldings = [
      // Profitable Positions (Gains)
      { symbol: 'RELIANCE.NS', quantity: 15, avgPrice: 2940.50, currentPrice: 2985.20, positionType: 'LONG' as const, productType: 'CNC' },
      { symbol: 'TCS.NS', quantity: 10, avgPrice: 4120.00, currentPrice: 4190.50, positionType: 'LONG' as const, productType: 'CNC' },
      { symbol: 'INFY.NS', quantity: 20, avgPrice: 1780.00, currentPrice: 1815.00, positionType: 'LONG' as const, productType: 'CNC' },

      // Unprofitable Positions (Losses)
      { symbol: 'TATASTEEL.NS', quantity: 50, avgPrice: 168.00, currentPrice: 154.20, positionType: 'LONG' as const, productType: 'CNC' }, // -₹690 Loss
      { symbol: 'ZOMATO.NS', quantity: 40, avgPrice: 282.00, currentPrice: 262.50, positionType: 'LONG' as const, productType: 'CNC' }, // -₹780 Loss
      { symbol: 'HDFCBANK.NS', quantity: 25, avgPrice: 1650.00, currentPrice: 1612.00, positionType: 'LONG' as const, productType: 'MIS' }, // -₹950 Loss
    ];

    // Historical Orders with both Realized Profits and Realized Losses
    const sampleOrders = [
      { symbol: 'TCS.NS', type: 'SELL', quantity: 5, price: 4200.00, status: 'EXECUTED', productType: 'CNC', realizedPnL: 400.00, minutesAgo: 15 },
      { symbol: 'TATASTEEL.NS', type: 'SELL', quantity: 20, price: 155.00, status: 'EXECUTED', productType: 'CNC', realizedPnL: -260.00, minutesAgo: 30 }, // Realized Loss
      { symbol: 'WIPRO.NS', type: 'COVER', quantity: 30, price: 535.00, status: 'EXECUTED', productType: 'MIS', realizedPnL: -450.00, minutesAgo: 45 }, // Realized Loss
      { symbol: 'INFY.NS', type: 'SELL', quantity: 10, price: 1825.00, status: 'EXECUTED', productType: 'CNC', realizedPnL: 450.00, minutesAgo: 60 },
      { symbol: 'RELIANCE.NS', type: 'BUY', quantity: 15, price: 2940.50, status: 'EXECUTED', productType: 'CNC', minutesAgo: 90 },
      { symbol: 'TCS.NS', type: 'BUY', quantity: 15, price: 4120.00, status: 'EXECUTED', productType: 'CNC', minutesAgo: 120 },
      { symbol: 'TATASTEEL.NS', type: 'BUY', quantity: 70, price: 168.00, status: 'EXECUTED', productType: 'CNC', minutesAgo: 150 },
      { symbol: 'ZOMATO.NS', type: 'BUY', quantity: 40, price: 282.00, status: 'EXECUTED', productType: 'CNC', minutesAgo: 180 },
      { symbol: 'HDFCBANK.NS', type: 'BUY', quantity: 25, price: 1650.00, status: 'EXECUTED', productType: 'MIS', minutesAgo: 210 },
      { symbol: 'SBIN.NS', type: 'BUY', quantity: 50, price: 810.00, status: 'PENDING', productType: 'CNC', minutesAgo: 5 }, // Open Pending Order
    ];

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tradesphere_auto_seeded', 'true');
      }

      // 1. Ensure user account document exists with cash margin
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: `${userId}@tradesphere.app`,
        balance: 62450.00,
        createdAt: isoNow,
        updatedAt: isoNow,
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
          createdAt: isoNow,
          updatedAt: isoNow,
        });
      }

      // 3. Write historical orders and transactions (with profits and losses)
      for (let i = 0; i < sampleOrders.length; i++) {
        const o = sampleOrders[i];
        const orderTime = new Date(now.getTime() - (o.minutesAgo || 10) * 60000).toISOString();
        const orderId = `ord_${Date.now() - i * 1000}_${Math.random().toString(36).substring(2, 6)}`;

        await setDoc(doc(db, 'orders', orderId), {
          id: orderId,
          userId,
          stockSymbol: o.symbol,
          type: o.type,
          orderType: 'MARKET',
          quantity: o.quantity,
          price: o.price,
          executedPrice: o.status === 'EXECUTED' ? o.price : null,
          status: o.status,
          productType: o.productType,
          realizedPnL: o.realizedPnL !== undefined ? o.realizedPnL : null,
          createdAt: orderTime,
          executedAt: o.status === 'EXECUTED' ? orderTime : null,
        });

        // Add to transactions ledger if executed
        if (o.status === 'EXECUTED') {
          const txnId = `txn_${Date.now() - i * 1000}_${Math.random().toString(36).substring(2, 6)}`;
          await setDoc(doc(db, 'transactions', txnId), {
            id: txnId,
            userId,
            stockSymbol: o.symbol,
            type: o.type,
            quantity: o.quantity,
            price: o.price,
            productType: o.productType,
            orderType: 'MARKET',
            realizedPnL: o.realizedPnL !== undefined ? o.realizedPnL : null,
            createdAt: orderTime,
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to seed sample data to Firestore:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Execute and persist a live client trade directly to Cloud Firestore
   */
  const executeClientTrade = useCallback(async (trade: {
    symbol: string;
    side: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
    quantity: number;
    price: number;
    productType?: string;
    orderType?: string;
    realizedPnL?: number;
  }) => {
    if (!db) return;
    const now = new Date().toISOString();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txnId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const portId = `${userId}_${trade.symbol}`;

    try {
      // 1. Write order
      await setDoc(doc(db, 'orders', orderId), {
        id: orderId,
        userId,
        stockSymbol: trade.symbol,
        type: trade.side,
        orderType: trade.orderType || 'MARKET',
        productType: trade.productType || 'MIS',
        quantity: trade.quantity,
        price: trade.price,
        executedPrice: trade.price,
        status: 'EXECUTED',
        realizedPnL: trade.realizedPnL !== undefined ? trade.realizedPnL : null,
        createdAt: now,
        executedAt: now,
      });

      // 2. Write transaction
      await setDoc(doc(db, 'transactions', txnId), {
        id: txnId,
        userId,
        stockSymbol: trade.symbol,
        type: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        productType: trade.productType || 'MIS',
        orderType: trade.orderType || 'MARKET',
        realizedPnL: trade.realizedPnL !== undefined ? trade.realizedPnL : null,
        createdAt: now,
      });

      // 3. Update position
      const isShort = trade.side === 'SHORT';
      const isExit = trade.side === 'SELL' || trade.side === 'COVER';

      if (!isExit) {
        await setDoc(doc(db, 'portfolios', portId), {
          id: portId,
          userId,
          stockSymbol: trade.symbol,
          quantity: isShort ? -trade.quantity : trade.quantity,
          avgPrice: trade.price,
          currentPrice: trade.price,
          positionType: isShort ? 'SHORT' : 'LONG',
          productType: trade.productType || 'MIS',
          createdAt: now,
          updatedAt: now,
        }, { merge: true });
      }

      // 4. Update balance
      const cost = trade.price * trade.quantity;
      const balanceDelta = trade.side === 'BUY' ? -cost : trade.side === 'SELL' ? cost : 0;
      if (balanceDelta !== 0) {
        const newBal = Math.max(0, balance + balanceDelta);
        await setDoc(doc(db, 'users', userId), {
          balance: newBal,
          updatedAt: now,
        }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to execute client trade in Firestore:', err);
    }
  }, [userId, balance]);

  return {
    balance,
    positions,
    userOrders,
    liveTrades,
    isConnected,
    lastSyncTime,
    seedSampleData,
    executeClientTrade,
  };
}
