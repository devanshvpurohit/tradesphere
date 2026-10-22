import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = decodeURIComponent(params.symbol);

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1mo';

    const [quote, timeSeries] = await Promise.allSettled([
      marketService.getStockQuote(symbol),
      marketService.getTimeSeries(symbol, period),
    ]);

    if (quote.status === 'rejected') {
      return NextResponse.json(
        { error: 'Market data unavailable for this stock.' },
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
