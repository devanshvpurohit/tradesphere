'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { VideoDemoModal } from '@/components/video/VideoDemoModal';
import TradingModal from '@/components/TradingModal';
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
  Search,
  LineChart,
  SlidersHorizontal,
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
  week52High?: number;
  week52Low?: number;
  marketCap?: string;
  peRatio?: number;
  currency?: string;
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
  const [indianStocks, setIndianStocks] = useState<ExploreStock[]>([]);
  const [usStocks, setUsStocks] = useState<ExploreStock[]>([]);
  const [activeStockTab, setActiveStockTab] = useState<'INDIAN' | 'US' | 'GAINERS' | 'LOSERS'>('INDIAN');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Quick Trading Modal State
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [modalStock, setModalStock] = useState({
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    price: 2982.4,
    side: 'BUY' as 'BUY' | 'SELL',
  });

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
      const [indRes, usRes] = await Promise.allSettled([
        fetch('/api/stocks?market=indian'),
        fetch('/api/stocks?market=us'),
      ]);

      if (indRes.status === 'fulfilled' && indRes.value.ok) {
        const indData = await indRes.value.json();
        const indList = indData.stocks || [];
        setIndianStocks(indList);
        setStocks(indList);
      }

      if (usRes.status === 'fulfilled' && usRes.value.ok) {
        const usData = await usRes.value.json();
        setUsStocks(usData.stocks || []);
      }
    } catch (err) {
      console.error('Failed to fetch explore market prices:', err);
    } finally {
      setLoadingStocks(false);
    }
  };

  const displayedHomeStocks = useMemo(() => {
    let pool: ExploreStock[] = [];
    if (activeStockTab === 'INDIAN') {
      pool = indianStocks.length > 0 ? indianStocks : stocks;
    } else if (activeStockTab === 'US') {
      pool = usStocks;
    } else if (activeStockTab === 'GAINERS') {
      pool = [...indianStocks, ...usStocks].sort((a, b) => b.changePercent - a.changePercent);
    } else if (activeStockTab === 'LOSERS') {
      pool = [...indianStocks, ...usStocks].sort((a, b) => a.changePercent - b.changePercent);
    }

    if (!stockSearchQuery.trim()) return pool;
    const q = stockSearchQuery.toLowerCase().trim();
    return pool.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.sector && s.sector.toLowerCase().includes(q))
    );
  }, [activeStockTab, indianStocks, usStocks, stocks, stockSearchQuery]);

  const handleOpenHomeTrade = (symbol: string, name: string, price: number, side: 'BUY' | 'SELL') => {
    setModalStock({ symbol, name, price, side });
    setTradingModalOpen(true);
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

      {/* 1. EXPLORE MARKET LIVE TERMINAL SECTION */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                LIVE EXCHANGE QUOTES
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Sub-second Streaming</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Market Explorer</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live market quotes, 52-week ranges, and 1-click execution for Indian &amp; Global equities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Search symbol, company, sector..."
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-500"
              />
            </div>

            <Link
              href="/stocks"
              className="text-xs font-mono font-bold px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>Full Screener ({stocks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Market Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveStockTab('INDIAN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeStockTab === 'INDIAN'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Indian Equities (NSE/BSE)
          </button>
          <button
            onClick={() => setActiveStockTab('US')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeStockTab === 'US'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            US Tech Giants (NASDAQ)
          </button>
          <button
            onClick={() => setActiveStockTab('GAINERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeStockTab === 'GAINERS'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Top Gainers</span>
          </button>
          <button
            onClick={() => setActiveStockTab('LOSERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeStockTab === 'LOSERS'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Top Losers</span>
          </button>
        </div>

        {/* Live Stocks Grid */}
        {loadingStocks ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse h-64" />
            ))}
          </div>
        ) : displayedHomeStocks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <p className="text-slate-400 text-sm">No stocks matched &quot;{stockSearchQuery}&quot;</p>
            <button
              onClick={() => setStockSearchQuery('')}
              className="mt-3 text-xs text-blue-400 hover:underline font-semibold"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedHomeStocks.map((stock) => {
              const isPositive = stock.change >= 0;
              const currencySymbol = stock.symbol.endsWith('.NS') ? '₹' : '$';
              const isSelectedForAgent = selectedStock === stock.symbol;

              // 52 Week Range progress calculation
              const low52 = stock.week52Low || stock.price * 0.8;
              const high52 = stock.week52High || stock.price * 1.3;
              const range52Percent = Math.min(
                100,
                Math.max(0, ((stock.price - low52) / (high52 - low52)) * 100)
              );

              return (
                <div
                  key={stock.symbol}
                  className={`rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between group ${
                    isSelectedForAgent
                      ? 'bg-blue-950/30 border-2 border-blue-500/80 shadow-blue-500/10 ring-1 ring-blue-500/40'
                      : 'bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 shadow-black/10 hover:shadow-black/30'
                  }`}
                >
                  <div>
                    {/* Top Row: Symbol, Exchange badge & Day % */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/stocks/${stock.symbol}`}
                            className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5"
                          >
                            <span>{stock.symbol}</span>
                          </Link>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {stock.symbol.endsWith('.NS') ? 'NSE' : 'NASDAQ'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                          {stock.name}
                        </p>
                      </div>

                      <div
                        className={`text-right px-2 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1 ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Price and Day Change */}
                    <div className="mb-4">
                      <div className="text-2xl font-black font-mono text-white tracking-tight">
                        {currencySymbol}{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-xs font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{currencySymbol}{stock.change.toFixed(2)} Today
                      </div>
                    </div>

                    {/* 52W Range Bar */}
                    <div className="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                        <span>52W L: {currencySymbol}{low52.toFixed(1)}</span>
                        <span className="text-slate-300 font-semibold">52-Week Range</span>
                        <span>52W H: {currencySymbol}{high52.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${range52Percent}%` }}
                          className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                      </div>
                    </div>

                    {/* Meta tags: Day High/Low, Sector & Market Cap */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 mb-4 pb-3 border-b border-slate-800/60">
                      <div>Day Low: <span className="text-slate-200">{currencySymbol}{stock.low}</span></div>
                      <div className="text-right">Day High: <span className="text-slate-200">{currencySymbol}{stock.high}</span></div>
                      <div className="truncate">{stock.sector || 'Equities'}</div>
                      <div className="text-right font-mono truncate">{stock.marketCap || 'Large Cap'}</div>
                    </div>
                  </div>

                  {/* Action Buttons: BUY, SELL, Chart, and Select for AI Agent */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleOpenHomeTrade(stock.symbol, stock.name, stock.price, 'BUY')}
                        className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 text-center"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => handleOpenHomeTrade(stock.symbol, stock.name, stock.price, 'SELL')}
                        className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 active:scale-95 text-center"
                      >
                        SELL
                      </button>
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <LineChart className="w-3.5 h-3.5 text-blue-400" />
                        <span>Chart</span>
                      </Link>
                    </div>

                    {/* Select for AI Agent Button */}
                    <button
                      onClick={() => {
                        setSelectedStock(stock.symbol);
                        toast.success(`Selected ${stock.symbol} for AI Agent Broker`);
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        isSelectedForAgent
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span>{isSelectedForAgent ? '✓ Active Target for AI Agent' : 'Select for AI Agent'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Trading Modal for 1-Click Orders directly from Home */}
      <TradingModal
        isOpen={tradingModalOpen}
        onClose={() => setTradingModalOpen(false)}
        stockSymbol={modalStock.symbol}
        stockName={modalStock.name}
        currentPrice={modalStock.price}
        initialSide={modalStock.side}
        onOrderSuccess={() => fetchMarketPrices()}
      />
    </div>
  );
}
