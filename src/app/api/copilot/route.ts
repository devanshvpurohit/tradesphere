import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { copilotService } from '@/services/copilotService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'demo-user-123';
    const userEmail = user?.email || 'demo@tradesphere.io';

    const body = await request.json();
    const {
      message,
      model = 'gemma3:1b',
      provider = 'ollama',
      customApiKey,
      ollamaBaseUrl,
      activeContextSymbol,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const response = await copilotService.processUserMessage({
      userId,
      userEmail,
      message,
      model,
      provider,
      customApiKey,
      ollamaBaseUrl,
      activeContextSymbol,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in Copilot API:', error);
    return NextResponse.json(
      {
        error: 'Failed to process Copilot request.',
        details: error?.message || 'Internal error',
      },
      { status: 500 }
    );
  }
}
