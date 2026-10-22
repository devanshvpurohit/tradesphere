import { NextRequest, NextResponse } from 'next/server';
import { generateOptionChain } from '@/lib/options/blackScholes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const underlying = (searchParams.get('underlying') || 'NIFTY').toUpperCase() as 'NIFTY' | 'BANKNIFTY';

    const chain = generateOptionChain(underlying === 'BANKNIFTY' ? 'BANKNIFTY' : 'NIFTY');

    return NextResponse.json({ chain });
  } catch (error) {
    console.error('Options chain API error:', error);
    return NextResponse.json({ error: 'Failed to generate option chain' }, { status: 500 });
  }
}
