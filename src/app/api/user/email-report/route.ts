import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { tradingService } from '@/services/tradingService';
import { firebaseDb } from '@/lib/firebase/db';
import { sendEmailReport, EmailReportData } from '@/lib/email/gmailReport';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => ({}));
    const targetEmail = body.email || user?.email || 'dev7anshvpurohit@gmail.com';
    const userId = user?.id || 'demo-user-123';

    // 1. Fetch user profile, portfolio holdings and order ledger
    const [userDoc, holdingsWithQuotes, orders] = await Promise.all([
      firebaseDb.getUser(userId, targetEmail),
      tradingService.getPortfolio(userId),
      firebaseDb.getOrders(userId),
    ]);

    const totalInvested = holdingsWithQuotes.reduce((acc, h) => acc + h.investedValue, 0);
    const currentValue = holdingsWithQuotes.reduce((acc, h) => acc + h.currentValue, 0);
    const unrealizedPnl = currentValue - totalInvested;

    // 2. Build email report data
    const emailData: EmailReportData = {
      recipientEmail: targetEmail,
      userName: user?.name || 'TradeSphere Trader',
      accountBalance: userDoc.balance,
      totalPortfolioValue: currentValue + userDoc.balance,
      totalInvested,
      unrealizedPnl,
      holdings: holdingsWithQuotes.map((h) => ({
        symbol: h.stockSymbol,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
        currentPrice: h.currentPrice,
        pnl: h.profitLoss,
        pnlPercent: h.profitLossPercent,
      })),
      recentOrders: orders.slice(0, 15).map((o) => ({
        id: o.id,
        symbol: o.stockSymbol,
        side: o.type,
        quantity: o.quantity,
        price: o.price || o.executedPrice || 0,
        productType: o.productType,
        timestamp: o.createdAt,
        status: o.status,
      })),
      brokerNotes: body.brokerNotes || [
        {
          symbol: 'RELIANCE.NS',
          agentName: 'Alpha Gemma (Ollama)',
          action: 'BUY',
          rule: 'RSI < 35 Oversold Bounce with tight 1:2.5 Risk-Reward',
          confidence: 85,
          reasoning: 'RSI touched 28.4 on the daily chart; Bollinger Band lower touch confirms high-probability reversal.',
        },
      ],
    };

    const result = await sendEmailReport(emailData);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      recipient: targetEmail,
      previewHtml: result.previewHtml,
    });
  } catch (error: any) {
    console.error('Email report generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate email report' },
      { status: 500 }
    );
  }
}
