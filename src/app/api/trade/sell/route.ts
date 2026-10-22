import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { tradingService } from '@/services/tradingService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sellSchema = z.object({
  symbol: z.string(),
  quantity: z.number().positive().int(),
  productType: z.string().optional().default('MIS'),
  orderType: z.string().optional().default('MARKET'),
  price: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, quantity, productType, orderType, price } = sellSchema.parse(body);

    const result = await tradingService.sellStock(
      user.id,
      symbol,
      quantity,
      productType,
      orderType,
      price
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error selling stock:', error);
    return NextResponse.json({ error: 'Failed to sell stock' }, { status: 500 });
  }
}
