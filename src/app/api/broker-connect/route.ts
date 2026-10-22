import { NextRequest, NextResponse } from 'next/server';
import { brokerConnectService, BrokerCredentials } from '@/services/brokerConnectService';
import { nseBhavcopyService } from '@/services/nseBhavcopyService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'bhavcopy') {
      const bhav = await nseBhavcopyService.getBhavcopy();
      return NextResponse.json({ success: true, summary: bhav });
    }

    // Default status
    return NextResponse.json({
      status: 'active',
      activeProvider: 'auto',
      supportedProviders: [
        { id: 'auto', name: 'TradeSphere Auto Router', type: 'Hybrid Real-time Cloud', latency: '<35ms', status: 'Online' },
        { id: 'kite', name: 'Zerodha Kite Connect', type: 'Direct Institutional Broker', latency: '<15ms', status: 'Available' },
        { id: 'dhan', name: 'DhanHQ v2 API', type: 'Direct Broker Gateway', latency: '<18ms', status: 'Available' },
        { id: 'upstox', name: 'Upstox Pro API', type: 'Direct Broker Gateway', latency: '<20ms', status: 'Available' },
        { id: 'angelone', name: 'Angel One SmartAPI', type: 'Direct Broker Gateway', latency: '<22ms', status: 'Available' },
        { id: 'bhavcopy', name: 'NSE Official Bhavcopy', type: 'Official EOD Regulatory Feed', latency: '<10ms', status: 'Online' },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to query broker status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BrokerCredentials = await request.json();

    if (!body || !body.provider) {
      return NextResponse.json({ error: 'Broker provider is required' }, { status: 400 });
    }

    const testResult = await brokerConnectService.testConnection(body);
    const margins = await brokerConnectService.getBrokerMargins(body);

    return NextResponse.json({
      ...testResult,
      margins,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal error testing broker connection' },
      { status: 500 }
    );
  }
}
