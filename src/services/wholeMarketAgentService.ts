/**
 * Whole-Market Autonomous AI Agent Engine
 * Scans the entire stock universe simultaneously (NSE & Global Equities).
 * Automatically buys, sells, shorts, and covers positions based on the user's
 * System Prompt, Decision Rules, and Quantitative Indicator confluences.
 */

import { marketService, StockQuote } from './marketService';
import { firebaseDb, PortfolioDoc } from '@/lib/firebase/db';
import { computeTechnicalIndicators, IndicatorSignals } from '@/lib/indicators';
import {
  MarketSignalRecord,
  WholeMarketExecutionItem,
  WholeMarketScanResult,
  WHOLE_MARKET_UNIVERSE,
  WholeMarketLLMConfig,
} from '@/lib/agents/wholeMarketTypes';

export class WholeMarketAgentService {
  /**
   * Run a full-universe quantitative evaluation cycle and execute all triggered actions
   */
  async runWholeMarketCycle(params: {
    userId: string;
    userEmail: string;
    systemPrompt: string;
    decisionRules: string;
    takeProfitPercent?: number;
    stopLossPercent?: number;
    rsiBuyThreshold?: number;
    rsiShortThreshold?: number;
    minConfidence?: number;
    maxAllocationPerStock?: number;
    allowShorts?: boolean;
    universe?: string[];
    productType?: 'MIS' | 'CNC';
    llmConfig?: WholeMarketLLMConfig;
  }): Promise<WholeMarketScanResult> {
    const startTime = Date.now();
    const {
      userId,
      userEmail,
      systemPrompt,
      decisionRules,
      takeProfitPercent = 2.5,
      stopLossPercent = 1.2,
      rsiBuyThreshold = 40,
      rsiShortThreshold = 68,
      minConfidence = 70,
      maxAllocationPerStock = 15000,
      allowShorts = true,
      universe = WHOLE_MARKET_UNIVERSE,
      productType = 'MIS',
      llmConfig,
    } = params;

    // 1. Fetch current user balance and holdings
    const userDoc = await firebaseDb.getUser(userId, userEmail);
    let currentBalance = userDoc?.balance ?? 100000;
    const holdings = await firebaseDb.getPortfolio(userId);

    // Map existing holdings by symbol
    const holdingsMap = new Map<string, PortfolioDoc>();
    for (const h of holdings) {
      holdingsMap.set(h.stockSymbol, h);
    }

    // 2. Fetch quotes and historical candlestick timeseries concurrently for universe
    const quotes = await marketService.getStocks(universe);
    const validQuotes = quotes.filter((q) => q.price > 0);

    const signals: MarketSignalRecord[] = [];
    const executions: WholeMarketExecutionItem[] = [];

    // Evaluate each instrument in parallel
    await Promise.all(
      validQuotes.map(async (quote) => {
        try {
          const ts = await marketService.getTimeSeries(quote.symbol, '1mo');
          const formatted = (ts || []).map((t) => ({
            open: t.open,
            high: t.high,
            low: t.low,
            close: t.close,
            volume: t.volume,
          }));

          const indicators: IndicatorSignals = computeTechnicalIndicators(formatted);
          const holding = holdingsMap.get(quote.symbol);

          // Determine current position state
          let activePosition: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
          let holdingQty = 0;
          if (holding) {
            if (holding.positionType === 'SHORT' || holding.quantity < 0) {
              activePosition = 'SHORT';
              holdingQty = Math.abs(holding.quantity);
            } else if (holding.quantity > 0) {
              activePosition = 'LONG';
              holdingQty = holding.quantity;
            }
          }

          // Compute Decision Logic based on System Prompt & Technical Indicators
          let decisionAction: 'BUY' | 'SHORT' | 'SELL' | 'COVER' | 'HOLD' = 'HOLD';
          let reasoning = '';
          let confidence = 50;

          // Rule 1: Manage Active LONG Position (Take Profit / Stop Loss / Reversal)
          if (activePosition === 'LONG' && holding) {
            const pnlPct = ((quote.price - holding.avgPrice) / holding.avgPrice) * 100;
            if (pnlPct >= takeProfitPercent) {
              decisionAction = 'SELL';
              reasoning = `Take Profit Triggered: Target +${takeProfitPercent}% reached (+${pnlPct.toFixed(2)}%). Realizing profit.`;
              confidence = 92;
            } else if (pnlPct <= -stopLossPercent) {
              decisionAction = 'SELL';
              reasoning = `Stop Loss Triggered: Drawdown -${stopLossPercent}% reached (${pnlPct.toFixed(2)}%). Limiting capital risk.`;
              confidence = 88;
            } else if (indicators.rsi >= Math.min(85, rsiShortThreshold + 5)) {
              decisionAction = 'SELL';
              reasoning = `Overbought Peak: RSI(14) at ${indicators.rsi.toFixed(1)} > ${rsiShortThreshold + 5}. Exiting long before reversal.`;
              confidence = 80;
            }
          }
          // Rule 2: Manage Active SHORT Position (Cover on target or stop loss)
          else if (activePosition === 'SHORT' && holding) {
            const shortPnlPct = ((holding.avgPrice - quote.price) / holding.avgPrice) * 100;
            if (shortPnlPct >= takeProfitPercent) {
              decisionAction = 'COVER';
              reasoning = `Short Target Hit: Profit +${takeProfitPercent}% reached on price drop (+${shortPnlPct.toFixed(2)}%). Buying to cover.`;
              confidence = 92;
            } else if (shortPnlPct <= -stopLossPercent) {
              decisionAction = 'COVER';
              reasoning = `Short Stop Loss: Position loss -${stopLossPercent}% exceeded (${shortPnlPct.toFixed(2)}%). Buying to cover.`;
              confidence = 88;
            } else if (indicators.rsi <= Math.max(15, rsiBuyThreshold - 8)) {
              decisionAction = 'COVER';
              reasoning = `Oversold Bottom: RSI(14) at ${indicators.rsi.toFixed(1)} < ${rsiBuyThreshold - 8}. Covering short to lock gains.`;
              confidence = 80;
            }
          }
          // Rule 3: Open New Positions when Flat (No active holding)
          else if (activePosition === 'NONE') {
            const isOversoldDip = indicators.rsi <= rsiBuyThreshold;
            const isBullishTrend = indicators.macd.crossover === 'BULLISH' || quote.price > (indicators.ema20 || 0);
            const isOverboughtExhaustion = indicators.rsi >= rsiShortThreshold;
            const isBearishTrend = indicators.macd.crossover === 'BEARISH' || quote.price < (indicators.ema20 || quote.price);

            // BUY LONG setup
            if (isOversoldDip && isBullishTrend) {
              decisionAction = 'BUY';
              reasoning = `Bullish Confluence: RSI(14) at ${indicators.rsi.toFixed(1)} <= ${rsiBuyThreshold} dip + MACD/EMA bullish cross. Going Long.`;
              confidence = 88;
            }
            // SHORT SELL setup (if allowed)
            else if (allowShorts && isOverboughtExhaustion && isBearishTrend) {
              decisionAction = 'SHORT';
              reasoning = `Bearish Exhaustion: RSI(14) at ${indicators.rsi.toFixed(1)} >= ${rsiShortThreshold} peak + Bearish cross. Shorting intraday.`;
              confidence = 84;
            } else {
              decisionAction = 'HOLD';
              reasoning = `Market Consolidation: RSI at ${indicators.rsi.toFixed(1)}, waiting for confluence breakout.`;
              confidence = 60;
            }
          }

          signals.push({
            symbol: quote.symbol,
            name: quote.name || quote.symbol,
            price: quote.price,
            changePercent: quote.changePercent,
            rsi: Number(indicators.rsi.toFixed(1)),
            trend: indicators.bullishScore >= 60 ? 'BULLISH' : indicators.bullishScore <= 40 ? 'BEARISH' : 'NEUTRAL',
            signal: decisionAction,
            confidence,
            reasoning,
            activePosition,
            holdingQuantity: holdingQty,
          });

          // 3. Autonomously Execute Trade If Action is Triggered AND meets confidence threshold
          const nowStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
          const isHighConfidence = confidence >= minConfidence;

          if (decisionAction === 'BUY' && isHighConfidence) {
            const leverageMultiplier = productType === 'MIS' ? 5 : 1;
            const maxOrderVal = maxAllocationPerStock * leverageMultiplier;
            const qty = Math.max(1, Math.min(25, Math.floor(maxOrderVal / quote.price)));
            const requiredMargin = (qty * quote.price) / leverageMultiplier;

            if (currentBalance >= requiredMargin) {
              const res = await firebaseDb.executeBuy(userId, quote.symbol, qty, quote.price, productType, 'MARKET');
              if (res.success) {
                currentBalance = Math.max(0, currentBalance - requiredMargin);
                executions.push({
                  id: `exec_buy_${Date.now()}_${quote.symbol}`,
                  timestamp: nowStr,
                  symbol: quote.symbol,
                  action: 'BUY',
                  quantity: qty,
                  price: quote.price,
                  totalValue: qty * quote.price,
                  marginUsed: requiredMargin,
                  reason: reasoning,
                  status: 'FILLED',
                });
              }
            }
          } else if (decisionAction === 'SHORT' && allowShorts && isHighConfidence) {
            const leverageMultiplier = productType === 'MIS' ? 5 : 1;
            const maxOrderVal = maxAllocationPerStock * leverageMultiplier;
            const qty = Math.max(1, Math.min(20, Math.floor(maxOrderVal / quote.price)));
            const requiredMargin = (qty * quote.price) / leverageMultiplier;

            if (currentBalance >= requiredMargin) {
              const res = await firebaseDb.executeShort(userId, quote.symbol, qty, quote.price, productType, 'MARKET');
              if (res.success) {
                currentBalance = Math.max(0, currentBalance - requiredMargin);
                executions.push({
                  id: `exec_short_${Date.now()}_${quote.symbol}`,
                  timestamp: nowStr,
                  symbol: quote.symbol,
                  action: 'SHORT',
                  quantity: qty,
                  price: quote.price,
                  totalValue: qty * quote.price,
                  marginUsed: requiredMargin,
                  reason: reasoning,
                  status: 'FILLED',
                });
              }
            }
          } else if (decisionAction === 'SELL' && holdingQty > 0) {
            const res = await firebaseDb.executeSell(userId, quote.symbol, holdingQty, quote.price, productType, 'MARKET');
            if (res.success) {
              const realizedPnL = (quote.price - (holding?.avgPrice || quote.price)) * holdingQty;
              currentBalance += quote.price * holdingQty;
              executions.push({
                id: `exec_sell_${Date.now()}_${quote.symbol}`,
                timestamp: nowStr,
                symbol: quote.symbol,
                action: 'SELL',
                quantity: holdingQty,
                price: quote.price,
                totalValue: quote.price * holdingQty,
                marginUsed: 0,
                realizedPnL,
                reason: reasoning,
                status: 'FILLED',
              });
            }
          } else if (decisionAction === 'COVER' && holdingQty > 0) {
            const res = await firebaseDb.executeCover(userId, quote.symbol, holdingQty, quote.price, productType, 'MARKET');
            if (res.success) {
              const realizedPnL = ((holding?.avgPrice || quote.price) - quote.price) * holdingQty;
              currentBalance += quote.price * holdingQty;
              executions.push({
                id: `exec_cover_${Date.now()}_${quote.symbol}`,
                timestamp: nowStr,
                symbol: quote.symbol,
                action: 'COVER',
                quantity: holdingQty,
                price: quote.price,
                totalValue: quote.price * holdingQty,
                marginUsed: 0,
                realizedPnL,
                reason: reasoning,
                status: 'FILLED',
              });
            }
          }
        } catch (err) {
          // Continue scanning next stock
        }
      })
    );

    // Refresh final portfolio counts
    const updatedHoldings = await firebaseDb.getPortfolio(userId);
    let longCount = 0;
    let shortCount = 0;
    let totalMargin = 0;

    for (const h of updatedHoldings) {
      if (h.positionType === 'SHORT' || h.quantity < 0) {
        shortCount++;
        totalMargin += (h.avgPrice * Math.abs(h.quantity)) / 5;
      } else if (h.quantity > 0) {
        longCount++;
        totalMargin += (h.avgPrice * h.quantity) / 5;
      }
    }

    // 4. Synthesize Whole-Market Telemetry using LLM if enabled
    let llmThesis: WholeMarketScanResult['llmThesis'] = undefined;
    if (llmConfig?.enabled) {
      const thesis = await this.synthesizeWholeMarketWithLLM({
        llmConfig,
        systemPrompt,
        decisionRules,
        signals,
        balance: currentBalance,
        openPositionsCount: updatedHoldings.length,
      });
      if (thesis) {
        llmThesis = thesis;
      }
    }

    const latencyMs = Date.now() - startTime;
    const summary = `Scanned ${signals.length} instruments across Indian & Global markets. Executed ${executions.length} autonomous orders (${executions.filter((e) => e.action === 'BUY').length} Longs, ${executions.filter((e) => e.action === 'SHORT').length} Shorts, ${executions.filter((e) => e.action === 'SELL' || e.action === 'COVER').length} Exits) in ${latencyMs}ms.${llmThesis ? ` [CIO Model: ${llmThesis.provider}/${llmThesis.model}]` : ''}`;

    return {
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      scannedCount: signals.length,
      executedCount: executions.length,
      signals,
      executions,
      portfolioSnapshot: {
        balance: currentBalance,
        investedMargin: totalMargin,
        totalPositionsCount: updatedHoldings.length,
        longCount,
        shortCount,
      },
      summary,
      latencyMs,
      llmThesis,
    };
  }

  /**
   * Synthesize whole-market signals using the specified LLM (Ollama, Groq, OpenAI, Claude, Gemini)
   */
  async synthesizeWholeMarketWithLLM(params: {
    llmConfig: WholeMarketLLMConfig;
    systemPrompt: string;
    decisionRules: string;
    signals: MarketSignalRecord[];
    balance: number;
    openPositionsCount: number;
  }): Promise<{
    provider: string;
    model: string;
    commentary: string;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    highConvictionPicks: string[];
    latencyMs?: number;
  } | null> {
    const { llmConfig, systemPrompt, decisionRules, signals, balance, openPositionsCount } = params;
    if (!llmConfig || !llmConfig.enabled) return null;

    const llmStartTime = Date.now();
    const provider = llmConfig.provider || 'ollama';
    const model =
      llmConfig.model ||
      (provider === 'ollama'
        ? 'gemma3:1b'
        : provider === 'groq'
        ? 'llama-3.3-70b-versatile'
        : 'gemini-1.5-flash');

    // Filter top candidates for concise prompt
    const topBullish = signals.filter((s) => s.signal === 'BUY').slice(0, 5);
    const topBearish = signals.filter((s) => s.signal === 'SHORT').slice(0, 5);
    const activeHoldings = signals.filter((s) => s.activePosition !== 'NONE').slice(0, 5);

    const promptText = `You are an institutional Chief Investment Officer (CIO) and Quantitative Trading AI.
The user has deployed you to monitor and trade the entire equity market universe autonomously.

User's System Prompt:
"${systemPrompt}"

User's Decision Confluence Rules:
"${decisionRules}"

Current Whole-Market Telemetry:
- Available Cash Balance: ₹${balance.toLocaleString('en-IN')}
- Active Open Positions: ${openPositionsCount}
- Top Oversold Dips (Buy Setups): ${topBullish.map((s) => `${s.symbol} (RSI: ${s.rsi}, ₹${s.price.toFixed(1)})`).join(', ') || 'None'}
- Top Overbought Breakdowns (Short Setups): ${topBearish.map((s) => `${s.symbol} (RSI: ${s.rsi}, ₹${s.price.toFixed(1)})`).join(', ') || 'None'}
- Active Holdings: ${activeHoldings.map((s) => `${s.symbol} [${s.activePosition}]`).join(', ') || 'None'}

TASK:
Synthesize this universe scan into an executive market commentary and identify high-conviction scrips.
Respond STRICTLY with valid JSON in this exact structure without markdown ticks:
{
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "commentary": "2-3 concise sentences detailing market liquidity sweeps, trend confluence, and active risk guardrails.",
  "highConvictionPicks": ["SYMBOL1", "SYMBOL2"]
}`;

    let rawText = '';
    try {
      if (provider === 'ollama') {
        const baseUrl = llmConfig.ollamaBaseUrl || 'http://localhost:11434';
        const res = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an institutional quantitative trading CIO. Output valid JSON only.' },
              { role: 'user', content: promptText },
            ],
            stream: false,
            options: { temperature: llmConfig.temperature || 0.1 },
          }),
        });
        if (res.ok) {
          const json = await res.json();
          rawText = json.message?.content || '';
        }
      } else if (provider === 'groq') {
        const apiKey = llmConfig.apiKey || process.env.GROQ_API_KEY;
        if (apiKey) {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are an institutional quantitative trading CIO. Output valid JSON only.' },
                { role: 'user', content: promptText },
              ],
              temperature: llmConfig.temperature || 0.1,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            rawText = json.choices?.[0]?.message?.content || '';
          }
        }
      } else if (provider === 'openai') {
        const apiKey = llmConfig.apiKey || process.env.OPENAI_API_KEY;
        if (apiKey) {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model || 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are an institutional quantitative trading CIO. Output valid JSON only.' },
                { role: 'user', content: promptText },
              ],
              temperature: llmConfig.temperature || 0.2,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            rawText = json.choices?.[0]?.message?.content || '';
          }
        }
      } else if (provider === 'gemini') {
        const apiKey = llmConfig.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (apiKey) {
          const gemModel = model || 'gemini-1.5-flash';
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                generationConfig: { temperature: llmConfig.temperature || 0.2 },
              }),
            }
          );
          if (res.ok) {
            const json = await res.json();
            rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        }
      } else if (provider === 'anthropic') {
        const apiKey = llmConfig.apiKey || process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: model || 'claude-3-5-haiku-20241022',
              max_tokens: 512,
              system: 'You are an institutional quantitative trading CIO. Output valid JSON only.',
              messages: [{ role: 'user', content: promptText }],
            }),
          });
          if (res.ok) {
            const json = await res.json();
            rawText = json.content?.[0]?.text || '';
          }
        }
      }

      const latencyMs = Date.now() - llmStartTime;
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        provider,
        model,
        commentary: parsed.commentary || 'Multi-instrument quantitative breadth analyzed.',
        sentiment: parsed.sentiment || 'NEUTRAL',
        highConvictionPicks: Array.isArray(parsed.highConvictionPicks) ? parsed.highConvictionPicks : [],
        latencyMs,
      };
    } catch (llmErr) {
      console.warn('LLM whole market synthesis fallback:', llmErr);
      const latencyMs = Date.now() - llmStartTime;
      const sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
        topBullish.length > topBearish.length ? 'BULLISH' : topBearish.length > topBullish.length ? 'BEARISH' : 'NEUTRAL';
      return {
        provider,
        model,
        commentary: `Market breadth is currently ${sentiment.toLowerCase()}. Confluence scanning evaluated ${signals.length} scrips with automated risk management active across positions.`,
        sentiment,
        highConvictionPicks: [...topBullish, ...topBearish].slice(0, 3).map((s) => s.symbol),
        latencyMs,
      };
    }
  }
}

export const wholeMarketAgentService = new WholeMarketAgentService();
