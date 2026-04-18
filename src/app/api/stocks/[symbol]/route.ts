import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Fetch quote and time series data with fallback
    const [quote, timeSeries] = await Promise.allSettled([
      marketService.getStockQuote(symbol),
      marketService.getTimeSeries(symbol, '1mo', '1d'),
    ]);

    if (quote.status === 'rejected') {
      return NextResponse.json(
        { error: 'Market data unavailable for this stock. Please try again later.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      quote: quote.value,
      timeSeries: timeSeries.status === 'fulfilled' ? timeSeries.value : [],
    });
  } catch (error) {
    console.error('Error fetching stock details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock details' },
      { status: 500 }
    );
  }
}
