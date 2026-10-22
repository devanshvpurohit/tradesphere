/**
 * Shared Types for Whole-Market Autonomous Agent
 */

export interface MarketSignalRecord {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  rsi: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signal: 'BUY' | 'SHORT' | 'SELL' | 'COVER' | 'HOLD';
  confidence: number;
  reasoning: string;
  activePosition?: 'LONG' | 'SHORT' | 'NONE';
  holdingQuantity?: number;
}

export interface WholeMarketExecutionItem {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SHORT' | 'SELL' | 'COVER';
  quantity: number;
  price: number;
  totalValue: number;
  marginUsed: number;
  realizedPnL?: number;
  reason: string;
  status: 'FILLED' | 'REJECTED';
}

export interface WholeMarketScanResult {
  timestamp: string;
  scannedCount: number;
  executedCount: number;
  signals: MarketSignalRecord[];
  executions: WholeMarketExecutionItem[];
  portfolioSnapshot: {
    balance: number;
    investedMargin: number;
    totalPositionsCount: number;
    longCount: number;
    shortCount: number;
  };
  summary: string;
  latencyMs: number;
}

export const WHOLE_MARKET_UNIVERSE = [
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  'INFY.NS',
  'ICICIBANK.NS',
  'TATAMOTORS.NS',
  'SBIN.NS',
  'BHARTIARTL.NS',
  'ITC.NS',
  'LT.NS',
  'AXISBANK.NS',
  'KOTAKBANK.NS',
  'MARUTI.NS',
  'TITAN.NS',
  'TATASTEEL.NS',
  'BAJFINANCE.NS',
  'NVDA',
  'AAPL',
  'MSFT',
  'TSLA',
];
