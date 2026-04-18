import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Use the new search with fallback
    const results = await marketService.searchStocks(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching stocks:', error);
    return NextResponse.json(
      { error: 'Search temporarily unavailable', results: [] },
      { status: 500 }
    );
  }
}
