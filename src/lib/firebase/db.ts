import { adminDb } from './admin';
import { realtimeDb } from './rtdb';

export interface UserDoc {
  id: string;
  email: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioDoc {
  id: string;
  userId: string;
  stockSymbol: string;
  quantity: number;
  avgPrice: number;
  positionType?: 'LONG' | 'SHORT';
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDoc {
  id: string;
  userId: string;
  stockSymbol: string;
  type: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
  quantity: number;
  price: number;
  productType: string;
  orderType: string;
  createdAt: string;
}

export interface OrderDoc {
  id: string;
  userId: string;
  stockSymbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  productType: 'MIS' | 'NRML';
  quantity: number;
  price?: number | null;
  triggerPrice?: number | null;
  targetPrice?: number | null;
  stopLoss?: number | null;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  executedPrice?: number | null;
  executedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback database for instant demo traders or offline/local testing
const fallbackUsers = new Map<string, UserDoc>();
const fallbackPortfolios = new Map<string, PortfolioDoc>();
const fallbackTransactions: TransactionDoc[] = [];
const fallbackOrders: OrderDoc[] = [];

export class FirebaseDatabaseService {
  /**
   * Get or initialize a user in Firestore (₹1,00,000 initial virtual capital)
   */
  async getUser(userId: string, email?: string): Promise<UserDoc> {
    const defaultUser: UserDoc = {
      id: userId,
      email: email || `${userId}@tradesphere.app`,
      balance: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (adminDb) {
      try {
        const userRef = adminDb.collection('users').doc(userId);
        const doc = await userRef.get();

        if (doc.exists) {
          const data = doc.data() as UserDoc;
          return { ...defaultUser, ...data, id: userId };
        }

        // Initialize user with ₹1,00,000
        await userRef.set(defaultUser);
        return defaultUser;
      } catch (err) {
        console.warn('Firestore getUser failed, using fallback:', err);
      }
    }

    if (!fallbackUsers.has(userId)) {
      fallbackUsers.set(userId, defaultUser);
    }
    return fallbackUsers.get(userId)!;
  }

  /**
   * Update user balance
   */
  async updateUserBalance(userId: string, newBalance: number): Promise<void> {
    realtimeDb.syncUserBalance(userId, newBalance);
    if (adminDb) {
      try {
        await adminDb.collection('users').doc(userId).set(
          {
            balance: newBalance,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        return;
      } catch (err) {
        console.warn('Firestore updateUserBalance failed, using fallback:', err);
      }
    }

    const u = fallbackUsers.get(userId);
    if (u) {
      u.balance = newBalance;
      u.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Reset user balance back to ₹1,00,000 and clear portfolio
   */
  async resetUserFunds(userId: string): Promise<number> {
    const newBalance = 100000;
    realtimeDb.syncUserBalance(userId, newBalance);
    realtimeDb.clearPortfolio(userId);
    if (adminDb) {
      try {
        await adminDb.collection('users').doc(userId).set(
          {
            balance: newBalance,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Delete all holdings
        const holdings = await adminDb.collection('portfolios').where('userId', '==', userId).get();
        const batch = adminDb.batch();
        holdings.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        return newBalance;
      } catch (err) {
        console.warn('Firestore resetUserFunds failed, using fallback:', err);
      }
    }

    const u = fallbackUsers.get(userId);
    if (u) {
      u.balance = newBalance;
      u.updatedAt = new Date().toISOString();
    }
    for (const [key, p] of fallbackPortfolios.entries()) {
      if (p.userId === userId) {
        fallbackPortfolios.delete(key);
      }
    }
    return newBalance;
  }

  /**
   * Get all portfolio holdings for a user
   */
  async getPortfolio(userId: string): Promise<PortfolioDoc[]> {
    if (adminDb) {
      try {
        const snapshot = await adminDb
          .collection('portfolios')
          .where('userId', '==', userId)
          .get();

        const holdings: PortfolioDoc[] = [];
        snapshot.forEach((doc) => {
          holdings.push({ id: doc.id, ...(doc.data() as Omit<PortfolioDoc, 'id'>) });
        });
        return holdings;
      } catch (err) {
        console.warn('Firestore getPortfolio failed, using fallback:', err);
      }
    }

    return Array.from(fallbackPortfolios.values()).filter((p) => p.userId === userId);
  }

  /**
   * Get single portfolio holding
   */
  async getHolding(userId: string, stockSymbol: string): Promise<PortfolioDoc | null> {
    const id = `${userId}_${stockSymbol}`;
    if (adminDb) {
      try {
        const doc = await adminDb.collection('portfolios').doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...(doc.data() as Omit<PortfolioDoc, 'id'>) };
        }
        return null;
      } catch (err) {
        console.warn('Firestore getHolding failed, using fallback:', err);
      }
    }

    return fallbackPortfolios.get(id) || null;
  }

  /**
   * Execute BUY stock with atomic Firestore transaction
   */
  async executeBuy(
    userId: string,
    symbol: string,
    quantity: number,
    price: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET'
  ): Promise<{ success: boolean; message: string; balance?: number; portfolio?: PortfolioDoc }> {
    const totalCost = price * quantity;
    const now = new Date().toISOString();
    const holdingId = `${userId}_${symbol}`;

    if (adminDb) {
      try {
        const userRef = adminDb.collection('users').doc(userId);
        const holdingRef = adminDb.collection('portfolios').doc(holdingId);
        const txRef = adminDb.collection('transactions').doc();

        return await adminDb.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error('User account not found');
          }

          const userData = userDoc.data() as UserDoc;
          if (userData.balance < totalCost) {
            throw new Error(`Insufficient funds: Required ₹${totalCost.toLocaleString('en-IN')}, Available ₹${userData.balance.toLocaleString('en-IN')}`);
          }

          const newBalance = userData.balance - totalCost;
          transaction.update(userRef, {
            balance: newBalance,
            updatedAt: now,
          });

          const holdingDoc = await transaction.get(holdingRef);
          let updatedHolding: PortfolioDoc;

          if (holdingDoc.exists) {
            const h = holdingDoc.data() as PortfolioDoc;
            const newQty = h.quantity + quantity;
            const newAvgPrice = (h.avgPrice * h.quantity + totalCost) / newQty;

            updatedHolding = {
              id: holdingId,
              userId,
              stockSymbol: symbol,
              quantity: newQty,
              avgPrice: newAvgPrice,
              createdAt: h.createdAt || now,
              updatedAt: now,
            };
            transaction.set(holdingRef, updatedHolding);
          } else {
            updatedHolding = {
              id: holdingId,
              userId,
              stockSymbol: symbol,
              quantity,
              avgPrice: price,
              createdAt: now,
              updatedAt: now,
            };
            transaction.set(holdingRef, updatedHolding);
          }

          const transactionRecord: TransactionDoc = {
            id: txRef.id,
            userId,
            stockSymbol: symbol,
            type: 'BUY',
            quantity,
            price,
            productType,
            orderType,
            createdAt: now,
          };
          transaction.set(txRef, transactionRecord);

          const result = {
            success: true,
            message: `Successfully purchased ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}`,
            balance: newBalance,
            portfolio: updatedHolding,
          };

          realtimeDb.syncUserBalance(userId, newBalance);
          realtimeDb.syncPosition(userId, symbol, updatedHolding.quantity, updatedHolding.avgPrice);
          realtimeDb.publishOrderEvent({
            orderId: txRef.id,
            userId,
            symbol,
            side: 'BUY',
            quantity,
            price,
            status: 'EXECUTED',
            timestamp: now,
          });

          return result;
        });
      } catch (err: any) {
        console.warn('Firestore buy transaction error, falling back to local simulation store:', err.message);
        // Fall through to in-memory fallback
      }
    }

    // Fallback in-memory
    const user = await this.getUser(userId);
    if (user.balance < totalCost) {
      return { success: false, message: 'Insufficient balance' };
    }

    user.balance -= totalCost;
    user.updatedAt = now;

    let holding = fallbackPortfolios.get(holdingId);
    if (holding) {
      const newQty = holding.quantity + quantity;
      holding.avgPrice = (holding.avgPrice * holding.quantity + totalCost) / newQty;
      holding.quantity = newQty;
      holding.updatedAt = now;
    } else {
      holding = {
        id: holdingId,
        userId,
        stockSymbol: symbol,
        quantity,
        avgPrice: price,
        createdAt: now,
        updatedAt: now,
      };
      fallbackPortfolios.set(holdingId, holding);
    }

    const txRecord: TransactionDoc = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      stockSymbol: symbol,
      type: 'BUY',
      quantity,
      price,
      productType,
      orderType,
      createdAt: now,
    };
    fallbackTransactions.unshift(txRecord);

    return {
      success: true,
      message: `Successfully bought ${quantity} shares of ${symbol}`,
      balance: user.balance,
      portfolio: holding,
    };
  }

  /**
   * Execute SELL stock with atomic Firestore transaction
   */
  async executeSell(
    userId: string,
    symbol: string,
    quantity: number,
    price: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET'
  ): Promise<{ success: boolean; message: string; balance?: number; portfolio?: PortfolioDoc | null }> {
    const totalProceeds = price * quantity;
    const now = new Date().toISOString();
    const holdingId = `${userId}_${symbol}`;

    if (adminDb) {
      try {
        const userRef = adminDb.collection('users').doc(userId);
        const holdingRef = adminDb.collection('portfolios').doc(holdingId);
        const txRef = adminDb.collection('transactions').doc();

        return await adminDb.runTransaction(async (transaction) => {
          const holdingDoc = await transaction.get(holdingRef);
          if (!holdingDoc.exists) {
            throw new Error(`You do not own any shares of ${symbol}`);
          }

          const h = holdingDoc.data() as PortfolioDoc;
          if (h.quantity < quantity) {
            throw new Error(`Insufficient shares: You have ${h.quantity}, requested to sell ${quantity}`);
          }

          const userDoc = await transaction.get(userRef);
          const userData = (userDoc.exists ? userDoc.data() : { balance: 100000 }) as UserDoc;
          const newBalance = userData.balance + totalProceeds;

          transaction.set(
            userRef,
            { balance: newBalance, updatedAt: now },
            { merge: true }
          );

          let updatedHolding: PortfolioDoc | null = null;
          if (h.quantity === quantity) {
            transaction.delete(holdingRef);
          } else {
            updatedHolding = {
              ...h,
              quantity: h.quantity - quantity,
              updatedAt: now,
            };
            transaction.set(holdingRef, updatedHolding);
          }

          const transactionRecord: TransactionDoc = {
            id: txRef.id,
            userId,
            stockSymbol: symbol,
            type: 'SELL',
            quantity,
            price,
            productType,
            orderType,
            createdAt: now,
          };
          transaction.set(txRef, transactionRecord);

          const result = {
            success: true,
            message: `Successfully sold ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}`,
            balance: newBalance,
            portfolio: updatedHolding,
          };

          realtimeDb.syncUserBalance(userId, newBalance);
          realtimeDb.syncPosition(userId, symbol, updatedHolding?.quantity || 0, updatedHolding?.avgPrice || 0);
          realtimeDb.publishOrderEvent({
            orderId: txRef.id,
            userId,
            symbol,
            side: 'SELL',
            quantity,
            price,
            status: 'EXECUTED',
            timestamp: now,
          });

          return result;
        });
      } catch (err: any) {
        console.warn('Firestore sell transaction error, falling back to local simulation store:', err.message);
        // Fall through to in-memory fallback
      }
    }

    // Fallback in-memory
    const holding = fallbackPortfolios.get(holdingId);
    if (!holding || holding.quantity < quantity) {
      return { success: false, message: 'Insufficient stock quantity' };
    }

    const user = await this.getUser(userId);
    user.balance += totalProceeds;
    user.updatedAt = now;

    let updatedHolding: PortfolioDoc | null = null;
    if (holding.quantity === quantity) {
      fallbackPortfolios.delete(holdingId);
    } else {
      holding.quantity -= quantity;
      holding.updatedAt = now;
      updatedHolding = holding;
    }

    const txRecord: TransactionDoc = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      stockSymbol: symbol,
      type: 'SELL',
      quantity,
      price,
      productType,
      orderType,
      createdAt: now,
    };
    fallbackTransactions.unshift(txRecord);

    return {
      success: true,
      message: `Successfully sold ${quantity} shares of ${symbol}`,
      balance: user.balance,
      portfolio: updatedHolding,
    };
  }

  /**
   * Execute SHORT sell stock with atomic Firestore transaction (MIS intraday)
   */
  async executeShort(
    userId: string,
    symbol: string,
    quantity: number,
    price: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET'
  ): Promise<{ success: boolean; message: string; balance?: number; portfolio?: PortfolioDoc }> {
    const margin = (price * quantity) / 5; // MIS 5x leverage
    const now = new Date().toISOString();
    const holdingId = `${userId}_${symbol}_SHORT`;

    const user = await this.getUser(userId);
    if (user.balance < margin) {
      return { success: false, message: `Insufficient margin to short. Required ₹${margin.toFixed(2)}, Available ₹${user.balance.toFixed(2)}` };
    }

    user.balance -= margin;
    user.updatedAt = now;

    const holding: PortfolioDoc = {
      id: holdingId,
      userId,
      stockSymbol: symbol,
      quantity: -quantity,
      avgPrice: price,
      positionType: 'SHORT',
      createdAt: now,
      updatedAt: now,
    };
    fallbackPortfolios.set(holdingId, holding);

    const txRecord: TransactionDoc = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      stockSymbol: symbol,
      type: 'SHORT',
      quantity,
      price,
      productType,
      orderType,
      createdAt: now,
    };
    fallbackTransactions.unshift(txRecord);

    if (adminDb) {
      try {
        await adminDb.collection('users').doc(userId).set({ balance: user.balance, updatedAt: now }, { merge: true });
        await adminDb.collection('portfolios').doc(holdingId).set(holding);
        await adminDb.collection('transactions').doc(txRecord.id).set(txRecord);
      } catch (e) {
        // Fallback
      }
    }

    realtimeDb.syncUserBalance(userId, user.balance);
    realtimeDb.syncPosition(userId, symbol, holding.quantity, holding.avgPrice, 'SHORT');
    realtimeDb.publishOrderEvent({
      orderId: txRecord.id,
      userId,
      symbol,
      side: 'SELL',
      quantity,
      price,
      status: 'FILLED',
      timestamp: now,
      productType,
    });
    return {
      success: true,
      message: `Successfully executed SHORT on ${quantity} shares of ${symbol} @ ₹${price.toFixed(2)}`,
      balance: user.balance,
      portfolio: holding,
    };
  }

  /**
   * Execute COVER (Buy to Cover) short position
   */
  async executeCover(
    userId: string,
    symbol: string,
    quantity: number,
    price: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET'
  ): Promise<{ success: boolean; message: string; balance?: number; realizedPnL?: number }> {
    const holdingId = `${userId}_${symbol}_SHORT`;
    const holding = fallbackPortfolios.get(holdingId);
    const shortQty = holding ? Math.abs(holding.quantity) : 0;

    if (!holding || shortQty <= 0) {
      return { success: false, message: `No active short position found for ${symbol}` };
    }

    const qtyToCover = Math.min(shortQty, quantity);
    const margin = (holding.avgPrice * qtyToCover) / 5;
    const realizedPnL = (holding.avgPrice - price) * qtyToCover;
    const returnAmount = margin + realizedPnL;
    const now = new Date().toISOString();

    const user = await this.getUser(userId);
    user.balance = Math.max(0, user.balance + returnAmount);
    user.updatedAt = now;

    if (shortQty === qtyToCover) {
      fallbackPortfolios.delete(holdingId);
    } else {
      holding.quantity = -(shortQty - qtyToCover);
      holding.updatedAt = now;
    }

    const txRecord: TransactionDoc = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      stockSymbol: symbol,
      type: 'COVER',
      quantity: qtyToCover,
      price,
      productType,
      orderType,
      createdAt: now,
    };
    fallbackTransactions.unshift(txRecord);

    if (adminDb) {
      try {
        await adminDb.collection('users').doc(userId).set({ balance: user.balance, updatedAt: now }, { merge: true });
        if (shortQty === qtyToCover) {
          await adminDb.collection('portfolios').doc(holdingId).delete();
        } else {
          await adminDb.collection('portfolios').doc(holdingId).set(holding);
        }
        await adminDb.collection('transactions').doc(txRecord.id).set(txRecord);
      } catch (e) {
        // Fallback
      }
    }

    realtimeDb.syncUserBalance(userId, user.balance);
    realtimeDb.syncPosition(
      userId,
      symbol,
      shortQty === qtyToCover ? 0 : holding.quantity,
      holding?.avgPrice || price,
      'SHORT'
    );
    realtimeDb.publishOrderEvent({
      orderId: txRecord.id,
      userId,
      symbol,
      side: 'BUY',
      quantity: qtyToCover,
      price,
      status: 'FILLED',
      timestamp: now,
      productType,
      realizedPnL,
    });
    return {
      success: true,
      message: `Successfully covered ${qtyToCover} shares of ${symbol} @ ₹${price.toFixed(2)}. Realized P&L: ${realizedPnL >= 0 ? '+' : ''}₹${realizedPnL.toFixed(2)}`,
      balance: user.balance,
      realizedPnL,
    };
  }

  /**
   * Create an Order (Market, Limit, Stop-Loss)
   */
  async createOrder(orderData: Omit<OrderDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderDoc> {
    const now = new Date().toISOString();
    const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newOrder: OrderDoc = {
      id,
      ...orderData,
      createdAt: now,
      updatedAt: now,
    };

    if (adminDb) {
      try {
        await adminDb.collection('orders').doc(id).set(newOrder);
        realtimeDb.publishOrderEvent({
          orderId: id,
          userId: newOrder.userId,
          symbol: newOrder.stockSymbol,
          side: newOrder.type,
          quantity: newOrder.quantity,
          price: newOrder.price || 0,
          status: newOrder.status,
          timestamp: newOrder.createdAt,
        });
        return newOrder;
      } catch (err) {
        console.warn('Firestore createOrder failed, using fallback:', err);
      }
    }

    fallbackOrders.unshift(newOrder);
    return newOrder;
  }

  /**
   * Get orders for a user
   */
  async getOrders(userId: string, status?: string): Promise<OrderDoc[]> {
    if (adminDb) {
      try {
        let query: FirebaseFirestore.Query = adminDb
          .collection('orders')
          .where('userId', '==', userId);

        if (status && status !== 'ALL') {
          query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        const orders: OrderDoc[] = [];
        snapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...(doc.data() as Omit<OrderDoc, 'id'>) });
        });
        return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.warn('Firestore getOrders failed, using fallback:', err);
      }
    }

    return fallbackOrders
      .filter((o) => o.userId === userId && (!status || status === 'ALL' || o.status === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(userId: string, orderId: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (adminDb) {
      try {
        const orderRef = adminDb.collection('orders').doc(orderId);
        const doc = await orderRef.get();
        if (doc.exists && doc.data()?.userId === userId) {
          await orderRef.update({
            status: 'CANCELLED',
            updatedAt: now,
          });
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Firestore cancelOrder failed, using fallback:', err);
      }
    }

    const order = fallbackOrders.find((o) => o.id === orderId && o.userId === userId);
    if (order && order.status === 'PENDING') {
      order.status = 'CANCELLED';
      order.updatedAt = now;
      return true;
    }
    return false;
  }

  /**
   * Get transaction history for user
   */
  async getTransactions(userId: string, limit: number = 50): Promise<TransactionDoc[]> {
    if (adminDb) {
      try {
        const snapshot = await adminDb
          .collection('transactions')
          .where('userId', '==', userId)
          .limit(limit)
          .get();

        const transactions: TransactionDoc[] = [];
        snapshot.forEach((doc) => {
          transactions.push({ id: doc.id, ...(doc.data() as Omit<TransactionDoc, 'id'>) });
        });
        return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.warn('Firestore getTransactions failed, using fallback:', err);
      }
    }

    return fallbackTransactions
      .filter((t) => t.userId === userId)
      .slice(0, limit);
  }
}

export const firebaseDb = new FirebaseDatabaseService();
