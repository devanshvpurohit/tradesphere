import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { firebaseDb } from '@/lib/firebase/db';
import { tradingService } from '@/services/tradingService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in or use demo trader.' },
        { status: 401 }
      );
    }

    const userProfile = await firebaseDb.getUser(user.id, user.email);
    const portfolio = await tradingService.getPortfolio(user.id);

    const totalInvested = portfolio.reduce((sum, item) => sum + item.investedValue, 0);
    const totalCurrent = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
    const totalProfitLoss = totalCurrent - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return NextResponse.json({
      balance: userProfile.balance,
      portfolio,
      summary: {
        totalInvested,
        totalCurrent,
        totalProfitLoss,
        totalProfitLossPercent,
        totalValue: userProfile.balance + totalCurrent,
      },
      user: {
        id: userProfile.id,
        email: userProfile.email,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}
