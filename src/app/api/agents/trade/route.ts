import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { tradingService } from '@/services/tradingService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const agentTradeSchema = z.object({
  symbol: z.string(),
  quantity: z.number().int().positive(),
  side: z.enum(['BUY', 'SELL']),
  orderType: z.enum(['MARKET', 'LIMIT']).default('MARKET'),
  productType: z.enum(['MIS', 'NRML']).default('MIS'),
  price: z.number().optional(),
  agentName: z.string().optional().default('AI Agent Bot'),
  reason: z.string().optional().default('Algorithmic signal trigger'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    // Support testing without auth by falling back to demo account
    const userId = user ? user.id : request.headers.get('x-demo-user-id') || 'demo_agent_trader';

    const body = await request.json();
    const parsed = agentTradeSchema.parse(body);

    let result;
    if (parsed.side === 'BUY') {
      result = await tradingService.buyStock(
        userId,
        parsed.symbol,
        parsed.quantity,
        parsed.productType,
        parsed.orderType,
        parsed.price
      );
    } else {
      result = await tradingService.sellStock(
        userId,
        parsed.symbol,
        parsed.quantity,
        parsed.productType,
        parsed.orderType,
        parsed.price
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `[${parsed.agentName}] Successfully executed ${parsed.side} ${parsed.quantity} ${parsed.symbol}`,
      balance: result.balance,
      trade: {
        symbol: parsed.symbol,
        side: parsed.side,
        quantity: parsed.quantity,
        reason: parsed.reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid schema input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Agent trade execution failed' }, { status: 500 });
  }
}
