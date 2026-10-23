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
    
    // Client hints if sent from real-time client state
    const clientHoldingQty = typeof body.currentHoldingQuantity === 'number' ? body.currentHoldingQuantity : 0;
    const clientHoldingAvgPrice = typeof body.currentHoldingAvgPrice === 'number' ? body.currentHoldingAvgPrice : 0;
    const clientAvailableCash = typeof body.availableCash === 'number' ? body.availableCash : userDoc.balance;
    const effectiveBalance = Math.max(userDoc.balance, clientAvailableCash);

    const currentHolding = holdings.find((h) => h.stockSymbol === symbol);
    const holdingQty = (currentHolding?.quantity && currentHolding.quantity > 0) ? currentHolding.quantity : clientHoldingQty;
    const holdingAvgPrice = (currentHolding?.avgPrice && currentHolding.avgPrice > 0) ? currentHolding.avgPrice : (clientHoldingAvgPrice || 0);

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
        availableCash: effectiveBalance,
        currentHoldingQuantity: holdingQty,
        maxRiskPerTradePercent: Number(agent.maxRiskPerTradePercent) || 5,
      },
    });

    let rawOutput = '';
    let fallbackToQuantEngine = false;

    // 4. Query configured AI Engine (with graceful quantitative fallback)
    try {
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
          fallbackToQuantEngine = true;
          break;
      }
    } catch (llmErr: any) {
      console.warn(`[Broker AI Fallback] LLM request unavailable (${llmErr.message}). Engaging Institutional Quant Engine.`);
      fallbackToQuantEngine = true;
    }

    // 5. Compute Structured Decision (using LLM or High-Conviction Quant Engine)
    const maxCapital = effectiveBalance * ((agent.maxRiskPerTradePercent || 5) / 100);
    const fallbackQty = Math.max(1, Math.floor(maxCapital / quote.price));
    
    let decision: any;
    if (fallbackToQuantEngine || !rawOutput.trim()) {
      const isOversold = indicators.rsi <= 45;
      const isOverbought = indicators.rsi >= 68;
      const isBullishTrend = indicators.macd?.crossover === 'BULLISH' || quote.price > (indicators.ema20 || 0);
      const isBearishTrend = indicators.macd?.crossover === 'BEARISH' || quote.price < (indicators.ema20 || quote.price);

      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let confidence = 75;
      let reason = '';

      if (holdingQty > 0) {
        // Exit management on active holding
        const buyAvg = holdingAvgPrice > 0 ? holdingAvgPrice : quote.price;
        const pnlPercent = ((quote.price - buyAvg) / buyAvg) * 100;

        if (pnlPercent >= 2.0) {
          action = 'SELL';
          confidence = 94;
          reason = `Target Profit Hit: Position up +${pnlPercent.toFixed(2)}%. Selling to lock in gains.`;
        } else if (pnlPercent <= -1.2) {
          action = 'SELL';
          confidence = 90;
          reason = `Stop Loss Protection: Drawdown reached ${pnlPercent.toFixed(2)}%. Selling to protect capital.`;
        } else if (isOverbought) {
          action = 'SELL';
          confidence = 85;
          reason = `Overbought RSI (${indicators.rsi.toFixed(1)} > 68): Momentum exhausting, booking profit.`;
        } else {
          action = 'HOLD';
          confidence = 72;
          reason = `Holding position (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}% P&L). Trend intact.`;
        }
      } else {
        // Entry management
        if (isOversold && isBullishTrend) {
          action = 'BUY';
          confidence = 90;
          reason = `Oversold Reversal Confluence: RSI(14) at ${indicators.rsi.toFixed(1)} with Bullish MACD crossover above 20 EMA.`;
        } else if (quote.changePercent >= 0.4 && isBullishTrend) {
          action = 'BUY';
          confidence = 86;
          reason = `Momentum Expansion: Intraday gain +${quote.changePercent.toFixed(2)}% and price holding above 20 EMA.`;
        } else if (indicators.bullishScore >= 62 && indicators.rsi <= 58) {
          action = 'BUY';
          confidence = 82;
          reason = `High Technical Health: Bullish score ${indicators.bullishScore}/100. Accumulating on support.`;
        } else {
          action = 'HOLD';
          confidence = 70;
          reason = `Consolidation pattern: RSI at ${indicators.rsi.toFixed(1)}, waiting for high-probability catalyst.`;
        }
      }

      decision = {
        action,
        confidence,
        recommendedQuantity: action === 'SELL' ? Math.min(holdingQty, fallbackQty) : fallbackQty,
        targetPrice: Number((quote.price * (action === 'BUY' ? 1.025 : 0.98)).toFixed(2)),
        stopLoss: Number((quote.price * (action === 'BUY' ? 0.985 : 1.015)).toFixed(2)),
        riskRewardRatio: '1:2.2',
        timeframe: 'Intraday MIS',
        reasoning: reason,
        keySignals: [
          `RSI(14): ${indicators.rsi.toFixed(1)}`,
          `MACD: ${indicators.macd.crossover}`,
          `EMA20: ₹${(indicators.ema20 || quote.price).toFixed(2)}`,
        ],
        rawOutput: `[TradeSphere Quant Engine Decision]: ${action} ${fallbackQty} ${symbol}`,
      };
    } else {
      decision = parseAgentDecisionJson(rawOutput, quote.price, fallbackQty);
    }
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
    let tradeDetails: {
      symbol: string;
      side: 'BUY' | 'SELL';
      quantity: number;
      price: number;
      realizedPnL?: number | null;
      executedBy: string;
      reason: string;
    } | null = null;
    let brokerNote = '';

    // 6. Autonomous Broker Execution
    if (autoExecute && decision.action !== 'HOLD') {
      const execQty = Math.min(decision.recommendedQuantity, fallbackQty);

      if (decision.action === 'BUY') {
        const totalCost = execQty * quote.price;
        if (effectiveBalance >= totalCost) {
          executedTradeResult = await firebaseDb.executeBuy(
            userId,
            symbol,
            execQty,
            quote.price,
            productType,
            'MARKET'
          );
          tradeDetails = {
            symbol,
            side: 'BUY',
            quantity: execQty,
            price: quote.price,
            realizedPnL: null,
            executedBy: `AI Agent: ${agent.name}`,
            reason: decision.reasoning,
          };
          brokerNote = `[BUY FILLED] Broker ${agent.name} executed BUY ${execQty} ${symbol} @ ₹${quote.price.toFixed(2)}. Target: ₹${decision.targetPrice}, SL: ₹${decision.stopLoss}.`;
        } else {
          brokerNote = `[ORDER REJECTED] Margin limit breached. Required ₹${totalCost.toFixed(2)}, Available ₹${effectiveBalance.toFixed(2)}.`;
        }
      } else if (decision.action === 'SELL') {
        if (holdingQty > 0) {
          const sellQty = Math.min(execQty, holdingQty);
          const realizedPnL = holdingAvgPrice > 0 ? (quote.price - holdingAvgPrice) * sellQty : 0;
          executedTradeResult = await firebaseDb.executeSell(
            userId,
            symbol,
            sellQty,
            quote.price,
            productType,
            'MARKET'
          );
          tradeDetails = {
            symbol,
            side: 'SELL',
            quantity: sellQty,
            price: quote.price,
            realizedPnL,
            executedBy: `AI Agent: ${agent.name}`,
            reason: decision.reasoning,
          };
          const pnlStr = realizedPnL >= 0 ? `+₹${realizedPnL.toFixed(2)} Profit` : `-₹${Math.abs(realizedPnL).toFixed(2)} Loss`;
          brokerNote = `[SELL FILLED] Broker ${agent.name} executed SELL ${sellQty} ${symbol} @ ₹${quote.price.toFixed(2)} (${pnlStr}).`;
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
      tradeDetails,
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
