import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';
import { computeTechnicalIndicators } from '@/lib/indicators';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE.NS';

    const [quote, timeSeries] = await Promise.all([
      marketService.getStockQuote(symbol),
      marketService.getTimeSeries(symbol, '1mo'),
    ]);

    const formattedData = timeSeries.map((d) => ({
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    const indicators = computeTechnicalIndicators(formattedData);

    // AI Copilot Synthesis
    const supportLevel = Number((quote.low * 0.985).toFixed(2));
    const resistanceLevel = Number((quote.high * 1.015).toFixed(2));
    const riskLevel = indicators.rsi > 70 || indicators.rsi < 30 ? 'HIGH (Reversal Zone)' : 'MODERATE';

    return NextResponse.json({
      symbol,
      quote,
      indicators,
      aiAnalysis: {
        sentiment: indicators.bullishScore >= 60 ? 'BULLISH' : indicators.bullishScore <= 40 ? 'BEARISH' : 'NEUTRAL',
        bullishScore: indicators.bullishScore,
        verdict: indicators.overallVerdict,
        keySupport: supportLevel,
        keyResistance: resistanceLevel,
        riskLevel,
        rationale: indicators.summary,
        tradingTips: [
          indicators.rsi < 30 ? 'RSI indicates oversold conditions. Look for accumulation near key support.' : null,
          indicators.rsi > 70 ? 'RSI indicates overbought conditions. Consider trailing stop-loss to protect gains.' : null,
          indicators.macd.crossover === 'BULLISH' ? 'Bullish MACD momentum crossover confirmed on daily chart.' : null,
          `Set stop loss below ₹${supportLevel} to manage downside exposure.`,
        ].filter(Boolean),
      },
    });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json({ error: 'Failed to run AI analysis' }, { status: 500 });
  }
}
