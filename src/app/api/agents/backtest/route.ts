import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';
import { AgentSimulator } from '@/lib/agents/engine';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, symbol = 'RELIANCE.NS', period = '1mo', initialBalance = 100000 } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Strategy code is required.' }, { status: 400 });
    }

    const timeSeries = await marketService.getTimeSeries(symbol, period);

    if (!timeSeries || timeSeries.length < 15) {
      return NextResponse.json(
        { error: `Insufficient historical data to backtest ${symbol}.` },
        { status: 400 }
      );
    }

    const formattedCandles = timeSeries.map((c) => ({
      time: String(c.time),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));

    const result = AgentSimulator.runSimulation(
      code,
      formattedCandles,
      symbol,
      Number(initialBalance) || 100000
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Agent Backtest Error:', error);
    return NextResponse.json(
      { error: error.message || 'Simulation execution failed' },
      { status: 500 }
    );
  }
}
