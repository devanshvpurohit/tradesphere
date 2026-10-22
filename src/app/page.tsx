'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { VideoDemoModal } from '@/components/video/VideoDemoModal';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  BarChart3,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Globe2,
  Bot,
  Sliders,
  Cpu,
  Terminal,
  Activity,
  Play,
  Square,
  RotateCcw,
  Check,
  Target,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ExploreStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  sector?: string;
  source?: string;
}

const PRESET_SYSTEM_PROMPTS = [
  {
    name: 'Momentum Scalper (RSI + EMA)',
    prompt:
      'You are an aggressive autonomous quant broker. Monitor the 15m and Daily timeframe. When RSI is between 30 and 45 and price holds above 20 EMA, execute BUY for the user with 10 shares. Set strict Target at +2.5% and Stop Loss at -1.2%. If RSI exceeds 70, execute SELL to protect gains.',
    rules: '1. Max capital risk 5%.\n2. Execute BUY on momentum dip.\n3. Execute SELL on overbought peak.',
  },
  {
    name: 'Mean Reversion Quant',
    prompt:
      'You are a disciplined mean-reversion broker on NSE. Look for oversold extremes where price deviates >2 standard deviations below the VWAP/Bollinger mean. Execute BUY with 5 shares when panic selling subsides. Execute SELL when price reverts back to mean.',
    rules: '1. Minimum confidence 80%.\n2. Target +3.0%.\n3. Stop Loss -1.5%.',
  },
  {
    name: 'Institutional Swing Rider',
    prompt:
      'You are an institutional trend-following broker. Evaluate MACD crossover and multi-day volume expansion. Execute user actions to accumulate quality large-cap stocks on bullish confluence and exit when trend slows.',
    rules: '1. Position size: 10-15 shares.\n2. Prioritize NIFTY 50 blue chips.\n3. Protect downside capital.',
  },
];

export default function Home() {
  const [stocks, setStocks] = useState<ExploreStock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // AI Agent Broker State
  const [activeModel, setActiveModel] = useState('gemma3:1b');
  const [activeProvider, setActiveProvider] = useState<'ollama' | 'groq' | 'openai' | 'claude' | 'gemini'>('ollama');
  const [systemPrompt, setSystemPrompt] = useState(PRESET_SYSTEM_PROMPTS[0].prompt);
  const [decisionRules, setDecisionRules] = useState(PRESET_SYSTEM_PROMPTS[0].rules);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Autonomous Continuous Runner State
  const [isRunnerActive, setIsRunnerActive] = useState(false);
  const [runnerCycle, setRunnerCycle] = useState(0);
  const [countdown, setCountdown] = useState(20);
  const runnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop runner cleanup on unmount
  useEffect(() => {
    return () => {
      if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Fetch live market prices from explore market API
  useEffect(() => {
    fetchMarketPrices();
    const interval = setInterval(fetchMarketPrices, 10000); // 10s fresh stream
    return () => clearInterval(interval);
  }, []);

  const fetchMarketPrices = async () => {
    try {
      const res = await fetch('/api/stocks?market=indian');
      if (res.ok) {
        const data = await res.json();
        if (data.stocks && data.stocks.length > 0) {
          setStocks(data.stocks);
        }
      }
    } catch (err) {
      console.error('Failed to fetch explore market prices:', err);
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleRunAIBroker = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    const payload = {
      agent: {
        id: `agent-home-${Date.now()}`,
        name: `TradeSphere AI Broker (${activeModel})`,
        provider: activeProvider,
        model: activeModel,
        systemPrompt,
        decisionRules,
        maxRiskPerTradePercent: 5,
      },
      symbol: selectedStock,
      autoExecute: true,
      productType: 'MIS',
    };

    try {
      const res = await fetch('/api/agents/broker-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playOrderSuccess();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setExecutionResult(data);
        toast.success(`AI Action: ${data.decision?.action} ${selectedStock}`, {
          description: data.brokerNote || 'Autonomous trade executed in portfolio.',
        });
      } else {
        soundManager.playOrderCancel();
        toast.error('AI Broker Execution Failed', { description: data.error || 'Check parameters' });
      }
    } catch (err: any) {
      soundManager.playOrderCancel();
      toast.error('Network Error', { description: err?.message || 'Server timeout' });
    } finally {
      setIsExecuting(false);
    }
  };

  const startAgentRunner = () => {
    setIsRunnerActive(true);
    setRunnerCycle(1);
    setCountdown(20);
    toast.success('AI Agent Started!', {
      description: `Autonomous loop monitoring ${selectedStock} every 20 seconds.`,
    });

    // Execute first cycle immediately
    handleRunAIBroker();

    // Start 20s execution loop
    runnerTimerRef.current = setInterval(() => {
      setRunnerCycle((prev) => prev + 1);
      setCountdown(20);
      handleRunAIBroker();
    }, 20000);

    // 1-second countdown display
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);
  };

  const stopAgentRunner = () => {
    setIsRunnerActive(false);
    if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    toast.info('AI Agent Stopped', {
      description: 'Autonomous trading loop has been paused.',
    });
  };

  const currentStockObj = stocks.find((s) => s.symbol === selectedStock) || stocks[0];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 relative overflow-hidden">
      {/* Ambient Radial Lights */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-blue-600/25 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[65%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#070b12]/85 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0e17] rounded-[7px] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Trade<span className="text-blue-500">Sphere</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <Link href="/stocks" className="hover:text-white transition-colors">
              Market Explorer
            </Link>
            <Link href="/agents" className="hover:text-white transition-colors flex items-center gap-1.5 text-blue-400">
              <Bot className="w-3.5 h-3.5" />
              AI Agent Studio
            </Link>
            <Link href="/options" className="hover:text-white transition-colors">
              F&O Desk
            </Link>
            <Link href="/portfolio" className="hover:text-white transition-colors">
              Portfolio
            </Link>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              NSE / BSE Live
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center gap-1.5 active:scale-95"
            >
              <span>Get ₹1,00,000 Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-8 shadow-inner">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Autonomous Multi-LLM Quant Trading Simulator</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Real-Time Explore Market Quotes • Zero Financial Risk</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Trade with Live Market Prices &{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Autonomous AI Agents.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Preloaded with ₹1,00,000 in virtual capital. Deploy AI models that analyze real NSE/BSE stock quotes,
          follow your custom System Prompt, and autonomously execute Buy & Sell user actions.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Start Paper Trading</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/agents"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4 text-blue-400" />
            <span>Launch AI Agent Studio</span>
          </Link>

          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Watch Video Tour</span>
          </button>
        </div>
      </section>

      {/* 1. EXPLORE MARKET LIVE PRICES SECTION */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-black text-white tracking-tight">Explore Market Live Prices</h2>
            </div>
            <p className="text-xs text-slate-400">
              Live ticking Indian equity prices streaming directly from official NSE feeds
            </p>
          </div>

          <Link
            href="/stocks"
            className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <span>View Full Market Explorer ({stocks.length} scrips)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Live Stocks Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {loadingStocks
            ? Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse h-28" />
              ))
            : stocks.slice(0, 8).map((st) => {
                const isPositive = st.change >= 0;
                const isSelected = selectedStock === st.symbol;
                return (
                  <div
                    key={st.symbol}
                    onClick={() => setSelectedStock(st.symbol)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/70 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                        : 'bg-[#0c121e]/80 border-slate-800/80 hover:border-slate-700 hover:bg-[#11192a]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm font-mono truncate">{st.symbol.replace('.NS', '')}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-2.5 h-2.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 inline" />}
                          {isPositive ? '+' : ''}{st.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{st.name}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <div className="font-mono font-bold text-sm text-white">
                        ₹{st.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-blue-400 font-mono flex items-center gap-0.5">
                        {isSelected ? 'Selected' : 'Pick Scrip'}
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* 2. AUTONOMOUS AI AGENT BROKER COCKPIT */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0e1626] to-[#0a0f1d] border border-blue-500/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Autonomous AI Agent Broker Desk
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    USER ACTION EXECUTION
                  </span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                This AI Agent acts on your behalf: it reads live explore prices, interprets your System Prompt as base,
                and autonomously executes Buy or Sell orders into your portfolio.
              </p>
            </div>

            {/* Model Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'gemma3:1b', provider: 'ollama', name: 'Ollama (Gemma 3:1b)' },
                { id: 'llama-3.3-70b-versatile', provider: 'groq', name: 'Groq LPU (500 tok/s)' },
                { id: 'deepseek-r1', provider: 'ollama', name: 'DeepSeek R1 Quant' },
                { id: 'gpt-4o-mini', provider: 'openai', name: 'OpenAI GPT-4o' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveModel(m.id);
                    setActiveProvider(m.provider as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    activeModel === m.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Form & Live Execution Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left: System Prompt & Rules Base (Col Span 7) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Preset Strategies */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Load Pre-Built System Prompt Strategy:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SYSTEM_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSystemPrompt(p.prompt);
                        setDecisionRules(p.rules);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* System Prompt Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Base System Prompt (Governs AI Execution)
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">Agent Mandate</span>
                </div>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-[#070b13] border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none leading-relaxed"
                  placeholder="Enter system prompt instructions for buying and selling..."
                />
              </div>

              {/* Decision Rules */}
              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Quantitative Decision Rules
                </label>
                <textarea
                  rows={3}
                  value={decisionRules}
                  onChange={(e) => setDecisionRules(e.target.value)}
                  className="w-full bg-[#070b13] border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none leading-relaxed"
                  placeholder="1. If RSI < 35, execute BUY&#10;2. If profit > 2%, execute SELL"
                />
              </div>
            </div>

            {/* Right: Selected Scrip & Execution Trigger (Col Span 5) */}
            <div className="lg:col-span-5 bg-[#070b13] rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase font-mono">Target Scrip</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">Live Feed</span>
                </div>

                {/* Selected Scrip Card */}
                {currentStockObj && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-base text-white font-mono">{currentStockObj.symbol}</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          currentStockObj.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {currentStockObj.change >= 0 ? '+' : ''}{currentStockObj.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xl font-black font-mono text-white mb-2">
                      ₹{currentStockObj.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                      <div>High: ₹{currentStockObj.high}</div>
                      <div>Low: ₹{currentStockObj.low}</div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-400 leading-relaxed mb-4">
                  When you run the AI Agent, it will analyze {selectedStock} against the System Prompt and automatically
                  execute a <strong>BUY</strong> or <strong>SELL</strong> order into your portfolio ledger.
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                {/* Active Runner Status Ribbon (if active) */}
                {isRunnerActive && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-400 uppercase tracking-wide">
                        AI Agent Active (Cycle #{runnerCycle})
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      Next check in <span className="text-emerald-400 font-bold">{countdown}s</span>
                    </div>
                  </div>
                )}

                {/* Primary START AI AGENT Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Single Execution START Button */}
                  <button
                    onClick={handleRunAIBroker}
                    disabled={isExecuting}
                    className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isExecuting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        <span>Executing Order...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Start AI Agent (Execute)</span>
                      </>
                    )}
                  </button>

                  {/* Continuous Live Runner Toggle START/STOP Button */}
                  {isRunnerActive ? (
                    <button
                      onClick={stopAgentRunner}
                      className="w-full py-4 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black font-mono text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop AI Agent</span>
                    </button>
                  ) : (
                    <button
                      onClick={startAgentRunner}
                      className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black font-mono text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Start Continuous Agent</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Leverage: MIS 5x Intraday</span>
                  <Link href="/portfolio" className="text-emerald-400 hover:underline">
                    View Portfolio Ledger →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Live Broker Audit Execution Ticket */}
          {executionResult && (
            <div className="mt-6 p-5 rounded-2xl bg-[#070b13] border border-emerald-500/40 shadow-xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white text-sm">
                    Autonomous Action Executed:{' '}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        executionResult.decision?.action === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {executionResult.decision?.action}
                    </span>
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Latency: {executionResult.decision?.executionTimeMs}ms • Confidence: {executionResult.decision?.confidence}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-3">
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Recommended Qty</span>
                  <span className="font-bold text-white">{executionResult.decision?.recommendedQuantity} Shares</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Stop Loss Trigger</span>
                  <span className="font-bold text-rose-400">₹{executionResult.decision?.stopLoss}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Target Profit</span>
                  <span className="font-bold text-emerald-400">₹{executionResult.decision?.targetPrice}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">Portfolio Balance</span>
                  <span className="font-bold text-blue-400">
                    ₹{executionResult.portfolio?.balance?.toLocaleString('en-IN') || '1,00,000'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                <strong>System Prompt Confluence Reasoning:</strong> {executionResult.decision?.reasoning}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-14">
          <h2 className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-2">
            Institutional Infrastructure
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Built for Traders, Quants & Students
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">₹1,00,000 Virtual Capital</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every account is preloaded with ₹1,00,000 paper trading cash. Reset your balance anytime with one click to test new strategies.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Zerodha Kite Style Orders</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience Market, Limit, and Stop-Loss orders with MIS (Intraday with 5x margin) and CNC (Delivery) product types and GTT target brackets.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Autonomous AI Broker</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Define your System Prompt and Decision Rules. The AI autonomously monitors markets, manages risk, and executes user actions.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Firebase Cloud Backend</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Powered by Google Firebase Authentication and Cloud Firestore for atomic transaction execution, real-time sync, and rock-solid persistence.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TradeSphere</span>
            <span>— Virtual Indian Stock Market Simulator</span>
          </div>
          <div>
            Built with Next.js, Firebase Auth & Firestore, Tailwind CSS, and Lightweight Charts.
          </div>
        </div>
      </footer>

      <VideoDemoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
}
