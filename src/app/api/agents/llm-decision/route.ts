import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/services/marketService';
import { computeTechnicalIndicators } from '@/lib/indicators';
import {
  CustomAgentConfig,
  buildAgentEvaluationPrompt,
  parseAgentDecisionJson,
} from '@/lib/agents/customAgent';
import { realtimeDb } from '@/lib/firebase/rtdb';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      agent,
      symbol = 'RELIANCE.NS',
      portfolio = { availableCash: 100000, currentHoldingQuantity: 0 },
    }: {
      agent: CustomAgentConfig;
      symbol: string;
      portfolio: { availableCash: number; currentHoldingQuantity: number };
    } = body;

    if (!agent) {
      return NextResponse.json({ error: 'Agent configuration is required.' }, { status: 400 });
    }

    // 1. Fetch live quote and technical indicators
    const [quoteData, timeSeries] = await Promise.all([
      marketService.getStockQuote(symbol),
      marketService.getTimeSeries(symbol, '1mo'),
    ]);

    const quote = quoteData || {
      symbol,
      price: 2500,
      change: 12.5,
      changePercent: 0.5,
      high: 2520,
      low: 2480,
      volume: 1200000,
    };

    const formattedData = (timeSeries || []).map((d) => ({
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    const indicators = computeTechnicalIndicators(formattedData);

    // 2. Build structured quantitative prompt
    const prompt = buildAgentEvaluationPrompt({
      symbol,
      quote: {
        currentPrice: quote.price || 100,
        change: quote.change || 0,
        changePercent: quote.changePercent || 0,
        high: quote.high || quote.price,
        low: quote.low || quote.price,
        volume: quote.volume || 100000,
      },
      indicators,
      portfolio: {
        availableCash: Number(portfolio?.availableCash) || 100000,
        currentHoldingQuantity: Number(portfolio?.currentHoldingQuantity) || 0,
        maxRiskPerTradePercent: Number(agent.maxRiskPerTradePercent) || 5,
      },
    });

    let rawOutput = '';

    // 3. Dispatch to selected AI Provider
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
              { role: 'system', content: agent.systemPrompt },
              { role: 'user', content: prompt },
            ],
            stream: false,
            options: {
              temperature: agent.temperature || 0.1,
            },
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
        const apiKey = agent.apiKey;
        if (!apiKey) {
          throw new Error('OpenAI API Key is required. Please add it in the Agent settings.');
        }

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: agent.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: agent.systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: agent.temperature || 0.2,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`OpenAI API error: ${errData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        rawOutput = data.choices?.[0]?.message?.content || '';
        break;
      }

      case 'anthropic': {
        const apiKey = agent.apiKey;
        if (!apiKey) {
          throw new Error('Anthropic API Key is required. Please add it in the Agent settings.');
        }

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
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

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Anthropic API error: ${errData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        rawOutput = data.content?.[0]?.text || '';
        break;
      }

      case 'gemini': {
        const apiKey = agent.apiKey;
        if (!apiKey) {
          throw new Error('Google Gemini API Key is required. Please add it in the Agent settings.');
        }

        const model = agent.model || 'gemini-1.5-flash';
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${agent.systemPrompt}\n\n${prompt}` }],
                },
              ],
              generationConfig: {
                temperature: agent.temperature || 0.2,
              },
            }),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Gemini API error: ${errData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        break;
      }

      case 'groq': {
        const apiKey = agent.apiKey;
        if (!apiKey) {
          throw new Error('Groq API Key is required. Please add it in the Agent settings.');
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: agent.model || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: agent.systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: agent.temperature || 0.1,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Groq API error: ${errData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        rawOutput = data.choices?.[0]?.message?.content || '';
        break;
      }

      case 'openrouter': {
        const apiKey = agent.apiKey;
        if (!apiKey) {
          throw new Error('OpenRouter API Key is required. Please add it in the Agent settings.');
        }

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
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

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`OpenRouter API error: ${errData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        rawOutput = data.choices?.[0]?.message?.content || '';
        break;
      }

      default:
        throw new Error(`Unsupported AI provider: ${agent.provider}`);
    }

    const maxCapitalForTrade = (portfolio.availableCash * ((agent.maxRiskPerTradePercent || 5) / 100));
    const fallbackQty = Math.max(1, Math.floor(maxCapitalForTrade / quote.price));

    const decision = parseAgentDecisionJson(rawOutput, quote.price, fallbackQty);
    decision.executionTimeMs = Date.now() - startTime;

    // Broadcast AI agent trade signal to Realtime Database
    realtimeDb.broadcastAgentSignal(symbol, {
      agentName: agent.name,
      model: agent.model,
      provider: agent.provider,
      action: decision.action,
      confidence: decision.confidence,
      targetPrice: decision.targetPrice,
      stopLoss: decision.stopLoss,
      reasoning: decision.reasoning,
      keySignals: decision.keySignals,
    });

    return NextResponse.json({
      success: true,
      decision,
      quote: {
        symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        high: quote.high,
        low: quote.low,
      },
      indicators: {
        rsi: indicators.rsi,
        macd: indicators.macd,
        ema20: indicators.ema20,
        sma50: indicators.sma50,
        bollinger: indicators.bollinger,
        bullishScore: indicators.bullishScore,
        verdict: indicators.overallVerdict,
      },
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('LLM Agent Decision Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process AI agent decision',
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
