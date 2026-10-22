export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter';

export interface CustomAgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  provider: AIProvider;
  model: string;
  ollamaBaseUrl?: string; // Default http://localhost:11434
  apiKey?: string; // Optional (not needed for Ollama)
  systemPrompt: string;
  temperature: number;
  maxRiskPerTradePercent: number; // e.g. 5%
  isCustom?: boolean;
}

export interface AgentTradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0 - 100
  recommendedQuantity: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: string;
  timeframe: string;
  reasoning: string;
  keySignals: string[];
  rawOutput?: string;
  executionTimeMs?: number;
}

export const PROVIDER_METADATA: Record<
  AIProvider,
  {
    name: string;
    description: string;
    requiresApiKey: boolean;
    defaultModel: string;
    suggestedModels: { id: string; label: string }[];
    defaultEndpoint?: string;
    icon: string;
  }
> = {
  ollama: {
    name: 'Ollama (Local / Free)',
    description: 'Run 100% locally on your machine with zero API keys and complete privacy.',
    requiresApiKey: false,
    defaultModel: 'gemma3:1b',
    suggestedModels: [
      { id: 'gemma3:1b', label: 'Gemma 3 1B (Ultra-fast Local)' },
      { id: 'llama3.2', label: 'Llama 3.2 (Meta Lightweight)' },
      { id: 'llama3', label: 'Llama 3 8B' },
      { id: 'deepseek-r1', label: 'DeepSeek R1 (Reasoning)' },
      { id: 'mistral', label: 'Mistral 7B' },
      { id: 'qwen2.5-coder', label: 'Qwen 2.5 Coder' },
    ],
    defaultEndpoint: 'http://localhost:11434',
    icon: '🦙',
  },
  openai: {
    name: 'OpenAI',
    description: 'Industry-standard reasoning with GPT-4o and GPT-4o-mini.',
    requiresApiKey: true,
    defaultModel: 'gpt-4o-mini',
    suggestedModels: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost-Efficient)' },
      { id: 'gpt-4o', label: 'GPT-4o (Flagship Multimodal Intelligence)' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
    icon: '🟢',
  },
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Exceptional analytical discipline, risk nuance, and chain-of-thought.',
    requiresApiKey: true,
    defaultModel: 'claude-3-5-haiku-20241022',
    suggestedModels: [
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Lightning Fast)' },
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Institutional Grade)' },
    ],
    icon: '🟣',
  },
  gemini: {
    name: 'Google Gemini',
    description: 'High context window with fast inference and deep technical synthesis.',
    requiresApiKey: true,
    defaultModel: 'gemini-1.5-flash',
    suggestedModels: [
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Super Fast)' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Deep Reasoning)' },
      { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Next-Gen)' },
    ],
    icon: '🔵',
  },
  groq: {
    name: 'Groq (LPU Inference)',
    description: 'Ultra-low latency open models (500+ tokens/sec) for instant scalping.',
    requiresApiKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
    suggestedModels: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Versatile)' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Instant)' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (MoE)' },
    ],
    icon: '🟠',
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Unified gateway to 100+ open and proprietary models.',
    requiresApiKey: true,
    defaultModel: 'deepseek/deepseek-r1',
    suggestedModels: [
      { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1 via OpenRouter' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct' },
      { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
    ],
    icon: '🌐',
  },
};

export const PRESET_AGENTS: CustomAgentConfig[] = [
  {
    id: 'local-ollama-scalper',
    name: 'Alpha Gemma (Local Ollama)',
    role: 'Local High-Speed Quant Scalper',
    description: 'Runs directly on your hardware via local Ollama. Zero API costs, 100% data privacy.',
    avatar: '🦙',
    provider: 'ollama',
    model: 'gemma3:1b',
    ollamaBaseUrl: 'http://localhost:11434',
    temperature: 0.1,
    maxRiskPerTradePercent: 5,
    systemPrompt: `You are Alpha Gemma, a high-frequency algorithmic scalper running locally on the trader's hardware.
Your philosophy:
- Exploit technical momentum using RSI, Bollinger Bands, and MACD confirmation.
- If RSI is below 35 and price touches the lower Bollinger Band, seek a strong BUY reversal.
- If RSI is above 65 and price is near the upper band, seek a SELL or profit harvest.
- Always provide precise numerical stop-loss and target prices.
- You must respond with a strict, parseable JSON object matching the requested schema.`,
  },
  {
    id: 'claude-risk-guardian',
    name: 'Risk Guardian (Claude 3.5)',
    role: 'Institutional Risk & Capital Preservation Officer',
    description: 'Specializes in asymmetric risk-reward, tight stop-losses, and drawdown prevention.',
    avatar: '🛡️',
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    temperature: 0.2,
    maxRiskPerTradePercent: 3,
    systemPrompt: `You are the Chief Risk Officer for an institutional hedge fund.
Your primary directive: Protect capital at all costs. Never enter a trade with a Risk-to-Reward ratio less than 1:2.
Evaluate support/resistance zones, moving average alignment (EMA 20 vs SMA 50), and market volatility.
If conditions are choppy or indeterminate, recommend HOLD.
You must respond with a strict, parseable JSON object matching the requested schema.`,
  },
  {
    id: 'gpt4o-trend-surfer',
    name: 'Trend Surfer (GPT-4o)',
    role: 'Multi-Timeframe Trend & Volume Analyst',
    description: 'Identifies high-probability breakout trends with strong volume and moving average support.',
    avatar: '🏄‍♂️',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxRiskPerTradePercent: 6,
    systemPrompt: `You are Trend Surfer, an expert momentum trader who trades exclusively in the direction of the macro trend.
Key rules:
- Only BUY when price is trading above both EMA 20 and SMA 50 with positive MACD histogram.
- Only SELL when price breaks below key support or displays bearish divergence.
- Set realistic trailing targets and sensible stops.
You must respond with a strict, parseable JSON object matching the requested schema.`,
  },
  {
    id: 'groq-flash-scalper',
    name: 'Flash Quant (Groq LLaMA 3.3)',
    role: 'Ultra-Low Latency Mean Reversion Agent',
    description: 'Harnesses Groq LPUs for sub-second trade thesis generation and mean-reversion signals.',
    avatar: '⚡',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    maxRiskPerTradePercent: 4,
    systemPrompt: `You are Flash Quant, powered by high-speed Groq LPU inference.
You evaluate rapid statistical arbitrage and mean-reversion setups on Indian equities.
Focus on standard deviation expansions via Bollinger Bands and RSI extremes.
Provide instantaneous, decisive BUY/SELL/HOLD recommendations with clear numerical bounds.
You must respond with a strict, parseable JSON object matching the requested schema.`,
  },
];

export function buildAgentEvaluationPrompt(params: {
  symbol: string;
  quote: {
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
  };
  indicators: any;
  portfolio: {
    availableCash: number;
    currentHoldingQuantity: number;
    maxRiskPerTradePercent: number;
  };
}) {
  const { symbol, quote, indicators, portfolio } = params;
  const price = quote.currentPrice || 100;
  const maxCapitalForTrade = (portfolio.availableCash * (portfolio.maxRiskPerTradePercent / 100));
  const suggestedMaxQty = Math.max(1, Math.floor(maxCapitalForTrade / price));

  const rsiVal = typeof indicators?.rsi === 'number' ? indicators.rsi : 50;
  const macdVal = indicators?.macd?.MACD ?? indicators?.macd?.macd ?? 0;
  const signalVal = indicators?.macd?.signal ?? 0;
  const histVal = indicators?.macd?.histogram ?? 0;
  const crossover = indicators?.macd?.crossover || 'NEUTRAL';
  const ema20 = typeof indicators?.ema20 === 'number' ? indicators.ema20 : price;
  const sma50 = typeof indicators?.sma50 === 'number' ? indicators.sma50 : price;
  const bUpper = indicators?.bollinger?.upper ?? (price * 1.05);
  const bMid = indicators?.bollinger?.middle ?? price;
  const bLower = indicators?.bollinger?.lower ?? (price * 0.95);
  const bullishScore = indicators?.bullishScore ?? 50;
  const verdict = indicators?.overallVerdict ?? 'NEUTRAL';

  return `### REAL-TIME MARKET DATA FOR ${symbol}
- Current Market Price (LTP): ₹${price.toFixed(2)}
- 24h Change: ${(quote.change ?? 0) >= 0 ? '+' : ''}${(quote.change ?? 0).toFixed(2)} (${(quote.changePercent ?? 0).toFixed(2)}%)
- Day Range: Low ₹${(quote.low ?? price).toFixed(2)} — High ₹${(quote.high ?? price).toFixed(2)}
- 24h Volume: ${(quote.volume ?? 100000).toLocaleString('en-IN')}

### QUANTITATIVE TECHNICAL INDICATORS
- RSI (14 period): ${rsiVal.toFixed(2)} (${rsiVal < 30 ? 'OVERSOLD' : rsiVal > 70 ? 'OVERBOUGHT' : 'NEUTRAL'})
- MACD (12, 26, 9): Line=${Number(macdVal).toFixed(2)}, Signal=${Number(signalVal).toFixed(2)}, Histogram=${Number(histVal).toFixed(2)} [Crossover: ${crossover}]
- Exponential Moving Average (EMA 20): ₹${Number(ema20).toFixed(2)} (Price is ${price >= ema20 ? 'ABOVE' : 'BELOW'})
- Simple Moving Average (SMA 50): ₹${Number(sma50).toFixed(2)} (Price is ${price >= sma50 ? 'ABOVE' : 'BELOW'})
- Bollinger Bands (20, 2): Upper=₹${Number(bUpper).toFixed(2)}, Mid=₹${Number(bMid).toFixed(2)}, Lower=₹${Number(bLower).toFixed(2)}
- Composite Algorithmic Bullish Score: ${bullishScore}/100 [${verdict}]

### TRADER PORTFOLIO & RISK BOUNDS
- Available Cash Balance: ₹${portfolio.availableCash.toLocaleString('en-IN')}
- Current Existing Shares in Portfolio: ${portfolio.currentHoldingQuantity}
- Risk Limit: Max ${portfolio.maxRiskPerTradePercent}% capital per trade (~₹${maxCapitalForTrade.toFixed(2)}, ~${suggestedMaxQty} shares)

### INSTRUCTIONS:
Analyze the market data according to your persona and trading strategy.
Determine the most optimal trade action (BUY, SELL, or HOLD).
You MUST respond ONLY with a valid JSON object matching the following structure. Do NOT add markdown fences or extra conversational text outside the JSON.

{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": <integer between 50 and 99>,
  "recommendedQuantity": <integer quantity of shares, maximum ${suggestedMaxQty}>,
  "targetPrice": <numeric target price in INR>,
  "stopLoss": <numeric stop loss price in INR>,
  "riskRewardRatio": "<e.g. 1:2.4>",
  "timeframe": "<e.g. Intraday / 3-5 Days Swing>",
  "reasoning": "<2-3 clear sentences explaining your technical rationale>",
  "keySignals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}`;
}

export function parseAgentDecisionJson(
  rawText: string,
  fallbackPrice: number,
  fallbackQty: number
): AgentTradeDecision {
  try {
    // Strip possible markdown code blocks ```json ... ```
    let clean = rawText.trim();
    if (clean.includes('```')) {
      const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        clean = match[1].trim();
      }
    }

    // Try finding the first '{' and last '}'
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(clean);

    const action = ['BUY', 'SELL', 'HOLD'].includes(String(parsed.action).toUpperCase())
      ? (String(parsed.action).toUpperCase() as 'BUY' | 'SELL' | 'HOLD')
      : 'HOLD';

    const confidence = Math.min(99, Math.max(50, Number(parsed.confidence) || 75));
    const recommendedQuantity = Math.max(1, Number(parsed.recommendedQuantity) || fallbackQty);
    const targetPrice = Number(parsed.targetPrice) || Number((fallbackPrice * 1.03).toFixed(2));
    const stopLoss = Number(parsed.stopLoss) || Number((fallbackPrice * 0.98).toFixed(2));
    const riskRewardRatio = String(parsed.riskRewardRatio || '1:2.0');
    const timeframe = String(parsed.timeframe || 'Swing / Intraday');
    const reasoning = String(parsed.reasoning || 'Technical indicator alignment indicates favorable risk-reward.');
    const keySignals = Array.isArray(parsed.keySignals) && parsed.keySignals.length > 0
      ? parsed.keySignals.map(String)
      : ['Momentum confirmation', 'Support/Resistance structure'];

    return {
      action,
      confidence,
      recommendedQuantity,
      targetPrice,
      stopLoss,
      riskRewardRatio,
      timeframe,
      reasoning,
      keySignals,
      rawOutput: rawText,
    };
  } catch (err) {
    console.warn('Failed to parse strict JSON from LLM, returning heuristic extraction:', err);
    // Simple regex fallback
    const isBuy = /BUY/i.test(rawText);
    const isSell = /SELL/i.test(rawText);
    const action = isBuy ? 'BUY' : isSell ? 'SELL' : 'HOLD';

    return {
      action,
      confidence: 70,
      recommendedQuantity: fallbackQty,
      targetPrice: Number((fallbackPrice * (action === 'BUY' ? 1.03 : 0.97)).toFixed(2)),
      stopLoss: Number((fallbackPrice * (action === 'BUY' ? 0.98 : 1.02)).toFixed(2)),
      riskRewardRatio: '1:2.0',
      timeframe: 'Intraday',
      reasoning: rawText.slice(0, 200).replace(/[\r\n]+/g, ' ') || 'AI model evaluated current indicators.',
      keySignals: ['AI synthesized technical pattern'],
      rawOutput: rawText,
    };
  }
}
