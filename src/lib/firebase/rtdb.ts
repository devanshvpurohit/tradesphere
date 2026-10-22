import { adminRtdb } from './admin';

export interface RealtimeUserBalance {
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface RealtimePosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  positionType?: 'LONG' | 'SHORT';
  updatedAt: string;
}

export interface RealtimeOrderNotification {
  orderId: string;
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL' | 'SHORT' | 'COVER' | string;
  quantity: number;
  price: number;
  status: string;
  timestamp: string;
  productType?: string;
  realizedPnL?: number;
}

class RealtimeDatabaseService {
  /**
   * Sync user balance to Realtime Database
   */
  async syncUserBalance(userId: string, balance: number): Promise<void> {
    if (!adminRtdb) return;
    try {
      await adminRtdb.ref(`users/${userId}/balance`).set(balance);
      await adminRtdb.ref(`users/${userId}/updatedAt`).set(new Date().toISOString());
    } catch (err) {
      console.warn('Realtime Database syncUserBalance error:', err);
    }
  }

  /**
   * Sync user positions to Realtime Database
   */
  async syncPosition(
    userId: string,
    symbol: string,
    quantity: number,
    avgPrice: number,
    positionType: 'LONG' | 'SHORT' = 'LONG'
  ): Promise<void> {
    if (!adminRtdb) return;
    try {
      const cleanSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '_');
      if (quantity === 0) {
        await adminRtdb.ref(`portfolios/${userId}/${cleanSymbol}`).remove();
      } else {
        await adminRtdb.ref(`portfolios/${userId}/${cleanSymbol}`).set({
          symbol,
          quantity,
          avgPrice,
          positionType,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Realtime Database syncPosition error:', err);
    }
  }

  /**
   * Clear all positions for user in Realtime Database (on reset)
   */
  async clearPortfolio(userId: string): Promise<void> {
    if (!adminRtdb) return;
    try {
      await adminRtdb.ref(`portfolios/${userId}`).remove();
    } catch (err) {
      console.warn('Realtime Database clearPortfolio error:', err);
    }
  }

  /**
   * Publish live order event to Realtime Database
   */
  async publishOrderEvent(order: RealtimeOrderNotification): Promise<void> {
    if (!adminRtdb) return;
    try {
      await adminRtdb.ref(`orders/${order.userId}/${order.orderId}`).set(order);
      // Also broadcast to public live activity feed
      await adminRtdb.ref(`live_activity`).push({
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price,
        productType: order.productType || 'MIS',
        realizedPnL: order.realizedPnL,
        timestamp: order.timestamp,
      });
    } catch (err) {
      console.warn('Realtime Database publishOrderEvent error:', err);
    }
  }

  /**
   * Broadcast AI agent trade signal to Realtime Database
   */
  async broadcastAgentSignal(symbol: string, signal: any): Promise<void> {
    if (!adminRtdb) return;
    try {
      const cleanSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '_');
      await adminRtdb.ref(`agent_signals/${cleanSymbol}`).set({
        ...signal,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Realtime Database broadcastAgentSignal error:', err);
    }
  }

  /**
   * Broadcast whole-market sweep result to Realtime Database
   */
  async broadcastMarketSweep(sweepData: any): Promise<void> {
    if (!adminRtdb) return;
    try {
      await adminRtdb.ref(`whole_market_sweeps/latest`).set({
        timestamp: new Date().toISOString(),
        scannedCount: sweepData.scannedCount,
        executedCount: sweepData.executedCount,
        summary: sweepData.summary,
        latencyMs: sweepData.latencyMs,
        llmThesis: sweepData.llmThesis || null,
      });
    } catch (err) {
      console.warn('Realtime Database broadcastMarketSweep error:', err);
    }
  }
}

export const realtimeDb = new RealtimeDatabaseService();
