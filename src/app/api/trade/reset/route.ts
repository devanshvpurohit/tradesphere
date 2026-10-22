import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { tradingService } from '@/services/tradingService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newBalance = await tradingService.resetDemoFunds(user.id);

    return NextResponse.json({
      success: true,
      message: 'Portfolio and funds successfully reset to ₹1,00,000 virtual capital.',
      balance: newBalance,
    });
  } catch (error) {
    console.error('Error resetting funds:', error);
    return NextResponse.json({ error: 'Failed to reset funds' }, { status: 500 });
  }
}
