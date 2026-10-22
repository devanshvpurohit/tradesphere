import { RSI, MACD, EMA, SMA, BollingerBands } from 'technicalindicators';

export interface IndicatorSignals {
  rsi: number;
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  macd: {
    MACD?: number;
    signal?: number;
    histogram?: number;
    crossover: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  ema20: number;
  sma50: number;
  bollinger: {
    upper?: number;
    middle?: number;
    lower?: number;
  };
  overallVerdict: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  bullishScore: number; // 0 - 100
  summary: string;
}

export function computeTechnicalIndicators(
  prices: { open: number; high: number; low: number; close: number; volume: number }[]
): IndicatorSignals {
  if (!prices || prices.length < 14) {
    return {
      rsi: 50,
      rsiSignal: 'NEUTRAL',
      macd: { crossover: 'NEUTRAL' },
      ema20: 0,
      sma50: 0,
      bollinger: {},
      overallVerdict: 'NEUTRAL',
      bullishScore: 50,
      summary: 'Insufficient historical data for indicator convergence.',
    };
  }

  const closes = prices.map((p) => p.close);
  const currentPrice = closes[closes.length - 1];

  // 1. RSI (14)
  const rsiValues = RSI.calculate({
    values: closes,
    period: Math.min(14, closes.length - 1),
  });
  const currentRsi = Number((rsiValues[rsiValues.length - 1] || 50).toFixed(2));
  const rsiSignal = currentRsi <= 30 ? 'OVERSOLD' : currentRsi >= 70 ? 'OVERBOUGHT' : 'NEUTRAL';

  // 2. MACD (12, 26, 9)
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const lastMacd = macdValues[macdValues.length - 1] || {};
  const prevMacd = macdValues[macdValues.length - 2] || {};
  let macdCrossover: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  if (lastMacd.MACD !== undefined && lastMacd.signal !== undefined) {
    if (lastMacd.MACD > lastMacd.signal && (prevMacd.MACD ?? 0) <= (prevMacd.signal ?? 0)) {
      macdCrossover = 'BULLISH';
    } else if (lastMacd.MACD < lastMacd.signal && (prevMacd.MACD ?? 0) >= (prevMacd.signal ?? 0)) {
      macdCrossover = 'BEARISH';
    } else if (lastMacd.MACD > lastMacd.signal) {
      macdCrossover = 'BULLISH';
    } else {
      macdCrossover = 'BEARISH';
    }
  }

  // 3. EMA 20 & SMA 50
  const ema20Values = EMA.calculate({
    values: closes,
    period: Math.min(20, closes.length - 1),
  });
  const currentEma20 = Number((ema20Values[ema20Values.length - 1] || currentPrice).toFixed(2));

  const sma50Values = SMA.calculate({
    values: closes,
    period: Math.min(50, closes.length - 1),
  });
  const currentSma50 = Number((sma50Values[sma50Values.length - 1] || currentPrice).toFixed(2));

  // 4. Bollinger Bands (20, 2)
  const bbValues = BollingerBands.calculate({
    values: closes,
    period: Math.min(20, closes.length - 1),
    stdDev: 2,
  });
  const lastBB = bbValues[bbValues.length - 1] || {};

  // Compute Bullish Score (0 - 100)
  let score = 50;

  // RSI factors
  if (currentRsi < 30) score += 20; // Oversold -> Buy opportunity
  else if (currentRsi > 70) score -= 20; // Overbought
  else if (currentRsi > 50) score += 5;

  // Trend factors
  if (currentPrice > currentEma20) score += 15;
  else score -= 15;

  if (currentPrice > currentSma50) score += 10;
  else score -= 10;

  // MACD factors
  if (macdCrossover === 'BULLISH') score += 15;
  else if (macdCrossover === 'BEARISH') score -= 15;

  score = Math.max(5, Math.min(95, score));

  let overallVerdict: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  if (score >= 75) overallVerdict = 'STRONG BUY';
  else if (score >= 60) overallVerdict = 'BUY';
  else if (score <= 25) overallVerdict = 'STRONG SELL';
  else if (score <= 40) overallVerdict = 'SELL';
  else overallVerdict = 'NEUTRAL';

  const summary = `RSI stands at ${currentRsi} (${rsiSignal.toLowerCase()}). Price is ${
    currentPrice >= currentEma20 ? 'trading above' : 'trading below'
  } the 20 EMA (₹${currentEma20}). MACD shows ${macdCrossover.toLowerCase()} momentum.`;

  return {
    rsi: currentRsi,
    rsiSignal,
    macd: {
      MACD: lastMacd.MACD ? Number(lastMacd.MACD.toFixed(2)) : undefined,
      signal: lastMacd.signal ? Number(lastMacd.signal.toFixed(2)) : undefined,
      histogram: lastMacd.histogram ? Number(lastMacd.histogram.toFixed(2)) : undefined,
      crossover: macdCrossover,
    },
    ema20: currentEma20,
    sma50: currentSma50,
    bollinger: {
      upper: lastBB.upper ? Number(lastBB.upper.toFixed(2)) : undefined,
      middle: lastBB.middle ? Number(lastBB.middle.toFixed(2)) : undefined,
      lower: lastBB.lower ? Number(lastBB.lower.toFixed(2)) : undefined,
    },
    overallVerdict,
    bullishScore: score,
    summary,
  };
}
