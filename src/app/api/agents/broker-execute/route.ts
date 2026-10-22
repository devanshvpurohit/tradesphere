import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { marketService } from '@/services/marketService';
import { computeTechnicalIndicators } from '@/lib/indicators';
import { firebaseDb } from '@/lib/firebase/db';
import { realtimeDb } from '@/lib/firebase/rtdb';
import { sendEmailReport } from '@/lib/email/gmailReport';
import {
  CustomAgentConfig,
  buildAgentEvaluationPrompt,
  parseAgentDecisionJson,
} from '@/lib/agents/customAgent';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await getAuthenticatedUser(request);
    const userId = user?.id || 'demo-user-123';
    const userEmail = user?.email || 'dev7anshvpurohit@gmail.com';

    const body = await request.json();
    const {
      agent,
      symbol = 'RELIANCE.NS',
      autoExecute = true,
      sendGmailAlert = false,
      productType = 'MIS',
    }: {
      agent: CustomAgentConfig;
      symbol: string;
      autoExecute: boolean;
      sendGmailAlert: boolean;
      productType: string;
    } = body;

    if (!agent) {
      return NextResponse.json({ error: 'Agent configuration is required.' }, { status: 400 });
    }

    // 1. Fetch current user portfolio and active positions
    const userDoc = await firebaseDb.getUser(userId, userEmail);
    const holdings = await firebaseDb.getPortfolio(userId);
    const currentHolding = holdings.find((h) => h.stockSymbol === symbol);
    const holdingQty = currentHolding?.quantity || 0;

    // 2. Fetch live market quote and quantitative technical indicators
    const [quoteData, timeSeries] = await Promise.all([
      marketService.getStockQuote(symbol),
      marketService.getTimeSeries(symbol, '1mo'),
    ]);

    const quote = quoteData || {
      symbol,
      price: 2980.5,
      change: 15.2,
      changePercent: 0.51,
      high: 3010,
      low: 2950,
      volume: 1500000,
    };

    const formattedData = (timeSeries || []).map((d) => ({
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    const indicators = computeTechnicalIndicators(formattedData);

    // 3. Construct broker decision prompt with user's system prompt & decision rules
    const prompt = buildAgentEvaluationPrompt({
      symbol,
      quote: {
        currentPrice: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        high: quote.high,
        low: quote.low,
        volume: quote.volume,
      },
      indicators,
      portfolio: {
        availableCash: userDoc.balance,
        currentHoldingQuantity: holdingQty,
        maxRiskPerTradePercent: Number(agent.maxRiskPerTradePercent) || 5,
      },
    });

    let rawOutput = '';

    // 4. Query configured AI Engine (Ollama, OpenAI, Claude, Gemini, Groq, OpenRouter)
    switch (agent.provider) {
      case 'ollama': {
        const baseUrl = agent.ollamaBaseUrl || 'http://localhost:11434';
        const model = agent.model || 'gemma3:1b';

        const res = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `${agent.systemPrompt}\n\nBROKER MANDATE: You are the autonomous broker for this account. Strictly apply decision rules, manage risk, and return pure JSON.`,
              },
              { role: 'user', content: prompt },
            ],
            stream: false,
            options: { temperature: agent.temperature || 0.1 },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Ollama error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        rawOutput = data.message?.content || '';
        break;
      }

      case 'openai': {
        if (!agent.apiKey) throw new Error('OpenAI API Key required');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${agent.apiKey}`,
          },
          body: JSON.stringify({
            model: agent.model || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `${agent.systemPrompt}\n\nBROKER MANDATE: You are an autonomous broker. Apply risk rules strictly and output JSON.`,
              },
              { role: 'user', content: prompt },
            ],
            temperature: agent.temperature || 0.2,
          }),
        });
        const data = await res.json();
        rawOutput = data.choices?.[0]?.message?.content || '';
        break;
      }

      case 'groq': {
        if (!agent.apiKey) throw new Error('Groq API Key required');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${agent.apiKey}`,
          },
          body: JSON.stringify({
            model: agent.model || 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `${agent.systemPrompt}\n\nBROKER MANDATE: Autonomous broker execution engine. Output JSON only.`,
              },
              { role: 'user', content: prompt },
            ],
            temperature: agent.temperature || 0.1,
          }),
        });
        const data = await res.json();
        rawOutput = data.choices?.[0]?.message?.content || '';
        break;
      }

      case 'gemini': {
        if (!agent.apiKey) throw new Error('Gemini API Key required');
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${agent.model || 'gemini-1.5-flash'}:generateContent?key=${agent.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${agent.systemPrompt}\n\n${prompt}` }] }],
              generationConfig: { temperature: agent.temperature || 0.2 },
            }),
          }
        );
        const data = await res.json();
        rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        break;
      }

      case 'anthropic': {
        if (!agent.apiKey) throw new Error('Anthropic API Key required');
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': agent.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: agent.model || 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: agent.systemPrompt,
            messages: [{ role: 'user', content: prompt }],
            temperature: agent.temperature || 0.2,
          }),
        });
        const data = await res.json();
        rawOutput = data.content?.[0]?.text || '';
        break;
      }

      case 'openrouter': {
        if (!agent.apiKey) throw new Error('OpenRouter API Key required');
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${agent.apiKey}`,
          },
          body: JSON.stringify({
            model: agent.model || 'deepseek/deepseek-r1',
            messages: [
              { role: 'system', content: agent.systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: agent.temperature || 0.2,
          }),
        });
        const data = await res.json();
        rawOutput = data.choices?.[0]?.message?.content || '';
        break;
      }

      default:
        throw new Error(`Unsupported provider: ${agent.provider}`);
    }

    // 5. Parse structured decision
    const maxCapital = userDoc.balance * ((agent.maxRiskPerTradePercent || 5) / 100);
    const fallbackQty = Math.max(1, Math.floor(maxCapital / quote.price));
    const decision = parseAgentDecisionJson(rawOutput, quote.price, fallbackQty);
    decision.executionTimeMs = Date.now() - startTime;

    // Broadcast signal to Realtime Database
    realtimeDb.broadcastAgentSignal(symbol, {
      agentName: agent.name,
      model: agent.model,
      action: decision.action,
      confidence: decision.confidence,
      targetPrice: decision.targetPrice,
      stopLoss: decision.stopLoss,
      reasoning: decision.reasoning,
    });

    let executedTradeResult: any = null;
    let brokerNote = '';

    // 6. Autonomous Broker Execution
    if (autoExecute && decision.action !== 'HOLD') {
      const execQty = Math.min(decision.recommendedQuantity, fallbackQty);

      if (decision.action === 'BUY') {
        const totalCost = execQty * quote.price;
        if (userDoc.balance >= totalCost) {
          executedTradeResult = await firebaseDb.executeBuy(
            userId,
            symbol,
            execQty,
            quote.price,
            productType,
            'MARKET'
          );
          brokerNote = `[BUY FILLED] Broker ${agent.name} executed BUY ${execQty} ${symbol} @ ₹${quote.price.toFixed(2)}. Target: ₹${decision.targetPrice}, SL: ₹${decision.stopLoss}.`;
        } else {
          brokerNote = `[ORDER REJECTED] Margin limit breached. Required ₹${totalCost.toFixed(2)}, Available ₹${userDoc.balance.toFixed(2)}.`;
        }
      } else if (decision.action === 'SELL') {
        if (holdingQty > 0) {
          const sellQty = Math.min(execQty, holdingQty);
          executedTradeResult = await firebaseDb.executeSell(
            userId,
            symbol,
            sellQty,
            quote.price,
            productType,
            'MARKET'
          );
          brokerNote = `[SELL FILLED] Broker ${agent.name} executed SELL ${sellQty} ${symbol} @ ₹${quote.price.toFixed(2)}. Profit/Capital realized.`;
        } else {
          brokerNote = `[SELL REJECTED] No existing shares of ${symbol} found in portfolio to exit.`;
        }
      }
    } else {
      brokerNote = decision.action === 'HOLD'
        ? `[HOLD] Market conditions do not satisfy ${agent.name}'s entry criteria.`
        : `[STANDBY] Signal generated: ${decision.action} ${decision.recommendedQuantity} ${symbol}. Awaiting manual authorization.`;
    }

    // 7. Optional Gmail Alert Dispatch
    if (sendGmailAlert && autoExecute && executedTradeResult?.success) {
      sendEmailReport({
        recipientEmail: userEmail,
        accountBalance: executedTradeResult.balance || userDoc.balance,
        totalPortfolioValue: executedTradeResult.balance || userDoc.balance,
        totalInvested: 0,
        unrealizedPnl: 0,
        holdings: [],
        recentOrders: [
          {
            id: `ord_${Date.now()}`,
            symbol,
            side: decision.action as 'BUY' | 'SELL',
            quantity: decision.recommendedQuantity,
            price: quote.price,
            productType,
            timestamp: new Date().toISOString(),
            status: 'EXECUTED',
            agentName: agent.name,
          },
        ],
        brokerNotes: [
          {
            symbol,
            agentName: agent.name,
            action: decision.action,
            rule: agent.systemPrompt.slice(0, 100),
            confidence: decision.confidence,
            reasoning: decision.reasoning,
          },
        ],
      }).catch((e) => console.warn('Background Gmail dispatch warning:', e));
    }

    return NextResponse.json({
      success: true,
      decision,
      brokerNote,
      executed: Boolean(executedTradeResult?.success),
      executedTradeResult,
      quote: {
        symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
      },
      indicators: {
        rsi: indicators.rsi,
        macd: indicators.macd,
        ema20: indicators.ema20,
        bullishScore: indicators.bullishScore,
        verdict: indicators.overallVerdict,
      },
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Autonomous Broker Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Broker execution failed',
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
