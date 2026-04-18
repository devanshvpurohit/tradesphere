import { NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';

export async function GET() {
  try {
    const popularSymbols = marketService.getPopularStocks();
    
    // Use the new batch fetch method with fallback
    const stocks = await marketService.getStocks(popularSymbols);

    // Filter out stocks with zero price (failed fetches)
    const validStocks = stocks.filter(stock => stock.price > 0);

    return NextResponse.json({ stocks: validStocks });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { error: 'Market data temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
