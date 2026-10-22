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

export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter';

export interface WholeMarketLLMConfig {
  enabled: boolean;
  provider: AIProvider;
  model: string;
  apiKey?: string;
  ollamaBaseUrl?: string;
  temperature?: number;
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
  llmThesis?: {
    provider: string;
    model: string;
    commentary: string;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    highConvictionPicks: string[];
    latencyMs?: number;
  };
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

export interface WholeMarketAgentConfig {
  systemPrompt: string;
  decisionRules: string;
  takeProfitPercent: number; // default: 2.5
  stopLossPercent: number; // default: 1.2
  rsiBuyThreshold: number; // default: 40
  rsiShortThreshold: number; // default: 68
  minConfidence: number; // default: 75
  maxAllocationPerStock: number; // default: 15000
  allowShorts: boolean; // default: true
  productType: 'MIS' | 'CNC'; // default: 'MIS'
  universe: string[];
  intervalSec: number; // default: 20
  llmConfig?: WholeMarketLLMConfig;
}

export interface StrategyPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  config: Partial<WholeMarketAgentConfig>;
}

export const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: 'aggressive_scalper',
    name: 'Aggressive Scalper',
    badge: 'High Frequency',
    description: 'Fast sweeps every 10s. Quick +1.8% target with tight -0.9% risk cutoff. Aggressive RSI entries.',
    config: {
      takeProfitPercent: 1.8,
      stopLossPercent: 0.9,
      rsiBuyThreshold: 38,
      rsiShortThreshold: 66,
      minConfidence: 70,
      maxAllocationPerStock: 12000,
      allowShorts: true,
      productType: 'MIS',
      intervalSec: 10,
      systemPrompt: 'You are an ultra-fast high-frequency intraday scalper. Exploit micro-dips and intraday momentum breakouts across the entire market universe. Liquidate quickly on target.',
      decisionRules: '1. Buy Long on RSI < 38 + bullish uptick.\n2. Short Sell on RSI > 66 + bearish exhaustion.\n3. Take profit at +1.8%, stop loss at -0.9%.\n4. Scalp with 5x leverage.',
    },
  },
  {
    id: 'momentum_trend',
    name: 'Momentum Trend Rider',
    badge: 'Swing & Breakout',
    description: 'Follows EMA 20/50 breakouts and MACD zero-line crosses. Wider targets (+3.5%) to ride institutional trends.',
    config: {
      takeProfitPercent: 3.5,
      stopLossPercent: 1.5,
      rsiBuyThreshold: 45,
      rsiShortThreshold: 72,
      minConfidence: 80,
      maxAllocationPerStock: 20000,
      allowShorts: true,
      productType: 'MIS',
      intervalSec: 20,
      systemPrompt: 'You are a disciplined quantitative trend follower. Target strong multi-candle directional expansions. Hold runners until trend reversal.',
      decisionRules: '1. Buy Long on EMA breakout + MACD bullish cross with RSI 40-50.\n2. Short Sell on breakdown below EMA with RSI > 72.\n3. Take profit at +3.5%, stop loss at -1.5%.',
    },
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion Desk',
    badge: 'Contrarian Dip Buyer',
    description: 'Buys only deep oversold market panic (RSI < 30) and shorts extreme overbought euphoria (RSI > 75). Conservative sizing.',
    config: {
      takeProfitPercent: 2.2,
      stopLossPercent: 1.2,
      rsiBuyThreshold: 30,
      rsiShortThreshold: 75,
      minConfidence: 85,
      maxAllocationPerStock: 15000,
      allowShorts: true,
      productType: 'MIS',
      intervalSec: 25,
      systemPrompt: 'You are a patient statistical arbitrage and mean reversion quant. Wait for extreme volatility deviations before executing.',
      decisionRules: '1. Buy Long only on extreme panic dips (RSI < 30).\n2. Short Sell on extreme exhaustion blow-offs (RSI > 75).\n3. Revert to mean at +2.2%, stop loss at -1.2%.',
    },
  },
  {
    id: 'long_only_delivery',
    name: 'Long-Only Value Accumulator',
    badge: 'CNC Long-Only',
    description: 'Zero shorting. Accumulates quality large-cap dips for delivery (CNC) without leverage liquidation risk.',
    config: {
      takeProfitPercent: 4.5,
      stopLossPercent: 2.0,
      rsiBuyThreshold: 42,
      rsiShortThreshold: 80,
      minConfidence: 75,
      maxAllocationPerStock: 25000,
      allowShorts: false,
      productType: 'CNC',
      intervalSec: 30,
      systemPrompt: 'You are an institutional value accumulator. Buy institutional dips for delivery without margin risk. Never short the market.',
      decisionRules: '1. Buy Long on oversold pullbacks (RSI < 42).\n2. No short selling allowed (Cash & Carry delivery).\n3. Harvest profit at +4.5%, defensive stop at -2.0%.',
    },
  },
];
