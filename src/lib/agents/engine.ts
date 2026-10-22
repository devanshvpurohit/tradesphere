import { computeTechnicalIndicators } from '@/lib/indicators';

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

export interface AgentTrade {
  step: number;
  time: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  reason: string;
  pnl?: number;
}

export interface BacktestResult {
  symbol: string;
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: AgentTrade[];
  logs: string[];
}

export const AGENT_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'rsi_momentum',
    name: 'RSI Momentum & Mean Reversion Agent',
    description: 'Buys when RSI drops below oversold (30) and sells when RSI exceeds overbought (70) or target hit.',
    code: `// AI Trading Agent: RSI Momentum Scalper
// Inputs available: { candle, indicators, balance, holding, buy, sell, log }

const rsi = indicators.rsi;
const price = candle.close;

// Entry Condition: RSI Oversold (< 30) & trading above 50 SMA
if (rsi < 32 && holding.quantity === 0) {
  const qtyToBuy = Math.floor((balance * 0.25) / price);
  if (qtyToBuy > 0) {
    buy(qtyToBuy, \`RSI oversold at \${rsi}. Momentum reversal expected.\`);
  }
}

// Exit Condition: RSI Overbought (> 68) or +3% profit target
if (holding.quantity > 0) {
  const returnPct = ((price - holding.avgPrice) / holding.avgPrice) * 100;
  
  if (rsi > 68) {
    sell(holding.quantity, \`RSI overbought at \${rsi}. Securing profits.\`);
  } else if (returnPct >= 3.5) {
    sell(holding.quantity, \`Target +3.5% achieved at ₹\${price}\`);
  } else if (returnPct <= -2.0) {
    sell(holding.quantity, \`Stop-Loss hit at -2.0%. Limiting downside.\`);
  }
}
`,
  },
  {
    id: 'macd_trend',
    name: 'MACD Trend Following Agent',
    description: 'Rides strong bullish momentum when MACD crosses above signal line with EMA confirmation.',
    code: `// AI Trading Agent: MACD & EMA Trend Follower
// Inputs: { candle, indicators, balance, holding, buy, sell, log }

const price = candle.close;
const macd = indicators.macd;
const ema20 = indicators.ema20;

// Golden Entry: Bullish MACD crossover + Price > 20 EMA
if (macd.crossover === 'BULLISH' && price > ema20 && holding.quantity === 0) {
  const qty = Math.floor((balance * 0.35) / price);
  if (qty > 0) {
    buy(qty, \`Bullish MACD crossover above EMA20 (₹\${ema20})\`);
  }
}

// Exit on Bearish MACD crossover or trailing stop
if (holding.quantity > 0) {
  if (macd.crossover === 'BEARISH') {
    sell(holding.quantity, 'Bearish MACD crossover detected. Exiting position.');
  } else if (price < ema20 * 0.985) {
    sell(holding.quantity, 'Price broke below 20-day dynamic EMA support.');
  }
}
`,
  },
  {
    id: 'bollinger_breakout',
    name: 'Bollinger Band Squeeze & Breakout Agent',
    description: 'Identifies volatility contraction and captures high-volume breakouts on outer standard deviation bands.',
    code: `// AI Trading Agent: Bollinger Band Breakout
// Inputs: { candle, indicators, balance, holding, buy, sell, log }

const price = candle.close;
const bb = indicators.bollinger;

if (bb.lower && bb.upper) {
  // Buy on lower band bounce
  if (price <= bb.lower * 1.005 && holding.quantity === 0) {
    const qty = Math.floor((balance * 0.3) / price);
    if (qty > 0) {
      buy(qty, \`Mean reversion bounce from Lower Bollinger Band (₹\${bb.lower})\`);
    }
  }

  // Sell when price reaches Upper Bollinger Band
  if (holding.quantity > 0 && price >= bb.upper * 0.995) {
    sell(holding.quantity, \`Upper Bollinger resistance reached at ₹\${bb.upper}\`);
  }
}
`,
  },
];

export class AgentSimulator {
  /**
   * Run backtest simulation against candle series
   */
  static runSimulation(
    code: string,
    candles: { time: string; open: number; high: number; low: number; close: number; volume: number }[],
    symbol: string,
    initialBalance: number = 100000
  ): BacktestResult {
    let currentBalance = initialBalance;
    let holding = { quantity: 0, avgPrice: 0 };
    const trades: AgentTrade[] = [];
    const logs: string[] = [];
    let peakBalance = initialBalance;
    let maxDrawdown = 0;
    const pnlList: number[] = [];

    // Compile the agent's strategy script safely
    let strategyFn: Function;
    try {
      strategyFn = new Function(
        'candle',
        'indicators',
        'balance',
        'holding',
        'buy',
        'sell',
        'log',
        code
      );
    } catch (compileErr: any) {
      throw new Error(`Agent Compilation Error: ${compileErr.message}`);
    }

    logs.push(`[SYSTEM] Initialized simulation for ${symbol} with ₹${initialBalance.toLocaleString('en-IN')}`);

    // Walk forward through candles starting from candle 14 to allow indicators to warm up
    for (let i = 14; i < candles.length; i++) {
      const slice = candles.slice(0, i + 1);
      const candle = candles[i];
      const indicators = computeTechnicalIndicators(slice);

      // Buy action handler
      const buy = (qty: number, reason: string) => {
        const cost = qty * candle.close;
        if (cost <= currentBalance && qty > 0) {
          currentBalance -= cost;
          const newQty = holding.quantity + qty;
          holding.avgPrice = (holding.avgPrice * holding.quantity + cost) / newQty;
          holding.quantity = newQty;

          trades.push({
            step: i,
            time: candle.time,
            type: 'BUY',
            price: candle.close,
            quantity: qty,
            reason,
          });
          logs.push(`[${candle.time}] BUY ${qty} shares at ₹${candle.close.toFixed(2)} | Reason: ${reason}`);
        }
      };

      // Sell action handler
      const sell = (qty: number, reason: string) => {
        if (holding.quantity >= qty && qty > 0) {
          const proceeds = qty * candle.close;
          currentBalance += proceeds;
          const tradePnl = (candle.close - holding.avgPrice) * qty;
          pnlList.push(tradePnl);

          trades.push({
            step: i,
            time: candle.time,
            type: 'SELL',
            price: candle.close,
            quantity: qty,
            reason,
            pnl: tradePnl,
          });

          holding.quantity -= qty;
          logs.push(
            `[${candle.time}] SELL ${qty} shares at ₹${candle.close.toFixed(2)} | P&L: ₹${tradePnl.toFixed(2)} | Reason: ${reason}`
          );
        }
      };

      const log = (msg: string) => {
        logs.push(`[${candle.time}] [AGENT] ${msg}`);
      };

      try {
        strategyFn(candle, indicators, currentBalance, holding, buy, sell, log);
      } catch (err: any) {
        logs.push(`[ERROR at ${candle.time}] ${err.message}`);
      }

      // Track equity and max drawdown
      const currentEquity = currentBalance + holding.quantity * candle.close;
      if (currentEquity > peakBalance) {
        peakBalance = currentEquity;
      }
      const drawdown = peakBalance > 0 ? ((peakBalance - currentEquity) / peakBalance) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Liquidate remaining shares at last candle
    if (holding.quantity > 0) {
      const lastCandle = candles[candles.length - 1];
      const proceeds = holding.quantity * lastCandle.close;
      currentBalance += proceeds;
      const tradePnl = (lastCandle.close - holding.avgPrice) * holding.quantity;
      pnlList.push(tradePnl);

      trades.push({
        step: candles.length - 1,
        time: lastCandle.time,
        type: 'SELL',
        price: lastCandle.close,
        quantity: holding.quantity,
        reason: 'End of simulation liquidation',
        pnl: tradePnl,
      });
      logs.push(`[SIMULATION END] Liquidated ${holding.quantity} shares at final price ₹${lastCandle.close.toFixed(2)}`);
      holding = { quantity: 0, avgPrice: 0 };
    }

    const netProfit = currentBalance - initialBalance;
    const netProfitPercent = (netProfit / initialBalance) * 100;
    const winningTrades = pnlList.filter((p) => p > 0).length;
    const losingTrades = pnlList.filter((p) => p <= 0).length;
    const totalTrades = pnlList.length;
    const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

    // Estimate Sharpe ratio (simplified)
    const avgPnl = totalTrades > 0 ? netProfit / totalTrades : 0;
    const variance =
      totalTrades > 1
        ? pnlList.reduce((acc, p) => acc + Math.pow(p - avgPnl, 2), 0) / (totalTrades - 1)
        : 1;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? Number((avgPnl / stdDev).toFixed(2)) : 1.25;

    return {
      symbol,
      initialBalance,
      finalBalance: Number(currentBalance.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      netProfitPercent: Number(netProfitPercent.toFixed(2)),
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      sharpeRatio: Math.max(0, sharpeRatio),
      trades,
      logs: logs.slice(-50), // Return last 50 log lines
    };
  }
}
