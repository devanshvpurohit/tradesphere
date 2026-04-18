import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');
    
    // Determine which stocks to fetch based on market parameter
    const symbols = market === 'indian' 
      ? marketService.getTopIndianStocks()
      : marketService.getPopularStocks();
    
    // Use the new batch fetch method with fallback
    const stocks = await marketService.getStocks(symbols);

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
