import { firebaseDb, PortfolioDoc, TransactionDoc } from '@/lib/firebase/db';
import { marketService } from './marketService';

export interface TradeResult {
  success: boolean;
  message: string;
  balance?: number;
  portfolio?: any;
}

export interface PortfolioItemWithQuote extends PortfolioDoc {
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  profitLoss: number;
  profitLossPercent: number;
  changePercent?: number;
}

class TradingService {
  async buyStock(
    userId: string,
    symbol: string,
    quantity: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET',
    specifiedPrice?: number
  ): Promise<TradeResult> {
    try {
      const stockPrice = specifiedPrice || (await marketService.getStockPrice(symbol)).price;
      return await firebaseDb.executeBuy(userId, symbol, quantity, stockPrice, productType, orderType);
    } catch (error: any) {
      console.error('Error buying stock in TradingService:', error);
      return { success: false, message: error.message || 'Failed to purchase stock' };
    }
  }

  async sellStock(
    userId: string,
    symbol: string,
    quantity: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET',
    specifiedPrice?: number
  ): Promise<TradeResult> {
    try {
      const stockPrice = specifiedPrice || (await marketService.getStockPrice(symbol)).price;
      return await firebaseDb.executeSell(userId, symbol, quantity, stockPrice, productType, orderType);
    } catch (error: any) {
      console.error('Error selling stock in TradingService:', error);
      return { success: false, message: error.message || 'Failed to sell stock' };
    }
  }

  async shortStock(
    userId: string,
    symbol: string,
    quantity: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET',
    specifiedPrice?: number
  ): Promise<TradeResult> {
    try {
      const stockPrice = specifiedPrice || (await marketService.getStockPrice(symbol)).price;
      return await firebaseDb.executeShort(userId, symbol, quantity, stockPrice, productType, orderType);
    } catch (error: any) {
      console.error('Error shorting stock in TradingService:', error);
      return { success: false, message: error.message || 'Failed to short stock' };
    }
  }

  async coverStock(
    userId: string,
    symbol: string,
    quantity: number,
    productType: string = 'MIS',
    orderType: string = 'MARKET',
    specifiedPrice?: number
  ): Promise<TradeResult> {
    try {
      const stockPrice = specifiedPrice || (await marketService.getStockPrice(symbol)).price;
      return await firebaseDb.executeCover(userId, symbol, quantity, stockPrice, productType, orderType);
    } catch (error: any) {
      console.error('Error covering stock in TradingService:', error);
      return { success: false, message: error.message || 'Failed to cover stock' };
    }
  }

  async getPortfolio(userId: string): Promise<PortfolioItemWithQuote[]> {
    const portfolios = await firebaseDb.getPortfolio(userId);

    const portfolioWithCurrentPrices = await Promise.all(
      portfolios.map(async (item) => {
        try {
          const stockPrice = await marketService.getStockPrice(item.stockSymbol);
          const currentPrice = stockPrice.price;
          const currentValue = currentPrice * item.quantity;
          const investedValue = item.avgPrice * item.quantity;
          const profitLoss = currentValue - investedValue;
          const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

          return {
            ...item,
            currentPrice,
            currentValue,
            investedValue,
            profitLoss,
            profitLossPercent,
            changePercent: stockPrice.changePercent,
          };
        } catch (error) {
          const investedValue = item.avgPrice * item.quantity;
          return {
            ...item,
            currentPrice: item.avgPrice,
            currentValue: investedValue,
            investedValue,
            profitLoss: 0,
            profitLossPercent: 0,
            changePercent: 0,
          };
        }
      })
    );

    return portfolioWithCurrentPrices;
  }

  async getTransactions(userId: string, limit: number = 50): Promise<TransactionDoc[]> {
    return firebaseDb.getTransactions(userId, limit);
  }

  async resetDemoFunds(userId: string) {
    return firebaseDb.resetUserFunds(userId);
  }
}

export const tradingService = new TradingService();
