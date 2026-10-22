import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { wholeMarketAgentService } from '@/services/wholeMarketAgentService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'demo-user-123';
    const userEmail = user?.email || 'demo@tradesphere.io';

    const body = await request.json();
    const {
      systemPrompt,
      decisionRules,
      maxAllocationPerStock = 20000,
      allowShorts = true,
      universe,
      productType = 'MIS',
    } = body;

    const result = await wholeMarketAgentService.runWholeMarketCycle({
      userId,
      userEmail,
      systemPrompt: systemPrompt || 'Maximize risk-adjusted returns with intraday momentum dips and overbought short breakdowns.',
      decisionRules: decisionRules || '1. Buy Long on RSI < 40 + EMA breakout.\n2. Short Sell on RSI > 68.\n3. Take profit at +2.5%, stop loss at -1.2%.',
      maxAllocationPerStock,
      allowShorts,
      universe,
      productType,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running whole market agent cycle:', error);
    return NextResponse.json(
      { error: 'Failed to execute whole market cycle', details: error?.message },
      { status: 500 }
    );
  }
}
