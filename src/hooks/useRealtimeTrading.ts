'use client';

import { useState, useEffect, useRef } from 'react';
import { rtdb } from '@/lib/firebase/client';
import { ref, onValue, off, query, limitToLast } from 'firebase/database';

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
  const [lastEvent, setLastEvent] = useState<RealtimeTradeEvent | null>(null);

  useEffect(() => {
    if (!rtdb || typeof window === 'undefined') {
      setIsConnected(false);
      return;
    }

    try {
      // 1. Listen to Realtime Balance: users/${userId}/balance
      const balanceRef = ref(rtdb, `users/${userId}/balance`);
      const unsubscribeBalance = onValue(
        balanceRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (typeof val === 'number') {
              setBalance(val);
              setIsConnected(true);
              setLastSyncTime(new Date());
            }
          }
        },
        (error) => {
          console.warn('RTDB balance listener error:', error);
        }
      );

      // 2. Listen to Realtime Positions: portfolios/${userId}
      const portfolioRef = ref(rtdb, `portfolios/${userId}`);
      const unsubscribePortfolio = onValue(
        portfolioRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list: RealtimePositionItem[] = Object.values(data || {}).map((item: any) => ({
              symbol: item.symbol || '',
              quantity: item.quantity || 0,
              avgPrice: item.avgPrice || 0,
              currentPrice: item.currentPrice,
              productType: item.productType,
              positionType: item.positionType || (item.quantity < 0 ? 'SHORT' : 'LONG'),
              updatedAt: item.updatedAt,
            }));
            setPositions(list.filter((p) => p.symbol && p.quantity !== 0));
            setIsConnected(true);
            setLastSyncTime(new Date());
          } else {
            setPositions([]);
          }
        },
        (error) => {
          console.warn('RTDB portfolio listener error:', error);
        }
      );

      // 3. Listen to User Orders: orders/${userId}
      const ordersRef = query(ref(rtdb, `orders/${userId}`), limitToLast(20));
      const unsubscribeOrders = onValue(
        ordersRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list: RealtimeTradeEvent[] = Object.values(data || {}).map((item: any) => ({
              orderId: item.orderId,
              symbol: item.symbol,
              side: item.side,
              quantity: item.quantity,
              price: item.price,
              status: item.status || 'FILLED',
              productType: item.productType,
              realizedPnL: item.realizedPnL,
              timestamp: item.timestamp,
            }));
            setUserOrders(list.reverse());
            setIsConnected(true);
            setLastSyncTime(new Date());
          }
        },
        (error) => {
          console.warn('RTDB orders listener error:', error);
        }
      );

      // 4. Listen to Global Live Trade Activity: live_activity
      const activityRef = query(ref(rtdb, 'live_activity'), limitToLast(25));
      const unsubscribeActivity = onValue(
        activityRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list: RealtimeTradeEvent[] = Object.values(data || {}).map((item: any) => ({
              symbol: item.symbol,
              side: item.side,
              quantity: item.quantity,
              price: item.price,
              productType: item.productType,
              realizedPnL: item.realizedPnL,
              timestamp: item.timestamp,
            }));
            const sorted = list.reverse();
            setLiveTrades(sorted);
            if (sorted[0]) {
              setLastEvent(sorted[0]);
            }
            setIsConnected(true);
            setLastSyncTime(new Date());
          }
        },
        (error) => {
          console.warn('RTDB activity listener error:', error);
        }
      );

      return () => {
        off(balanceRef);
        off(portfolioRef);
        off(ordersRef);
        off(activityRef);
      };
    } catch (err) {
      console.warn('Error setting up RTDB listeners:', err);
      setIsConnected(false);
    }
  }, [userId]);

  return {
    balance,
    positions,
    userOrders,
    liveTrades,
    lastEvent,
    isConnected,
    lastSyncTime,
  };
}
