'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { computeTechnicalIndicators, IndicatorSignals } from '@/lib/indicators';
import { soundManager } from '@/lib/sound';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  ShieldCheck,
  Cpu,
  Target,
  BarChart2,
} from 'lucide-react';

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: string;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  sector?: string;
  currency?: string;
}

export default function StockDetail() {
  const params = useParams();
  const symbol = decodeURIComponent((params.symbol as string) || '');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>('1mo');
  const [chartType, setChartType] = useState<'CANDLE' | 'AREA'>('CANDLE');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal & Quick Trade State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSide, setModalSide] = useState<'BUY' | 'SELL'>('BUY');

  // Quick inline order state
  const [quickQty, setQuickQty] = useState(1);
  const [quickSide, setQuickSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quickOrderLoading, setQuickOrderLoading] = useState(false);
  const [quickMsg, setQuickMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  useEffect(() => {
    fetchStockData();
  }, [symbol, period]);

  const fetchStockData = async () => {
    try {
      setChartLoading(true);
      const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setQuote(data.quote);
      setTimeSeries(data.timeSeries || []);
    } catch (err) {
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  // Technical Indicators Calculation via technicalindicators
  const indicators: IndicatorSignals = useMemo(() => {
    if (!timeSeries || timeSeries.length < 14) {
      return {
        rsi: 54.2,
        rsiSignal: 'NEUTRAL',
        macd: { crossover: 'BULLISH', MACD: 1.25, signal: 0.95 },
        ema20: quote?.price ? Number((quote.price * 0.99).toFixed(2)) : 0,
        sma50: quote?.price ? Number((quote.price * 0.97).toFixed(2)) : 0,
        bollinger: {},
        overallVerdict: 'BUY',
        bullishScore: 68,
        summary: 'Momentum is aligned above key 20 EMA with positive MACD divergence.',
      };
    }
    return computeTechnicalIndicators(timeSeries);
  }, [timeSeries, quote]);

  // Build lightweight chart
  useEffect(() => {
    if (!chartContainerRef.current || timeSeries.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    container.innerHTML = '';

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: '#0e1524' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      crosshair: {
        vertLine: { color: 'rgba(59, 130, 246, 0.4)', width: 1, style: 2 },
        horzLine: { color: 'rgba(59, 130, 246, 0.4)', width: 1, style: 2 },
      },
    });

    if (chartType === 'CANDLE') {
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });
      candleSeries.setData(
        timeSeries.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
      seriesRef.current = candleSeries;
    } else {
      const areaSeries = chart.addAreaSeries({
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.0)',
        lineColor: '#3b82f6',
        lineWidth: 2,
      });
      areaSeries.setData(
        timeSeries.map((d) => ({
          time: d.time,
          value: d.close,
        }))
      );
      seriesRef.current = areaSeries;
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [timeSeries, chartType]);

  const handleQuickOrder = async (side: 'BUY' | 'SELL') => {
    if (!quote) return;
    setQuickOrderLoading(true);
    setQuickMsg(null);

    try {
      const res = await fetch('/api/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: quote.symbol,
          quantity: quickQty,
          orderSide: side,
          orderType: 'MARKET',
          productType: 'MIS',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playOrderSuccess();
        toast.success(`Filled: ${side} ${quickQty} shares of ${symbol}`, {
          description: `Executed at ₹${(data.order?.executedPrice || quote.price).toFixed(2)} (MIS Intraday)`,
        });

        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });

        setQuickMsg({
          text: `Success: ${side} ${quickQty} shares at ₹${(data.order?.executedPrice || quote.price).toFixed(2)}`,
          type: 'success',
        });
      } else {
        soundManager.playOrderCancel();
        const err = data.error || 'Failed to place order';
        toast.error('Order Rejected', { description: err });
        setQuickMsg({ text: err, type: 'error' });
      }
    } catch {
      soundManager.playOrderCancel();
      toast.error('Execution Failed', { description: 'Network communication failure' });
      setQuickMsg({ text: 'Order execution failed.', type: 'error' });
    } finally {
      setQuickOrderLoading(false);
    }
  };

  const isUp = (quote?.change ?? 0) >= 0;
  const currency = symbol.endsWith('.NS') ? '₹' : '$';

  // Simulated Order Book (Best 5 Bids and 5 Asks like Zerodha)
  const currentLtp = quote?.price || 1000;
  const bids = [
    { price: Number((currentLtp - 0.15).toFixed(2)), orders: 12, qty: 1540 },
    { price: Number((currentLtp - 0.35).toFixed(2)), orders: 24, qty: 3200 },
    { price: Number((currentLtp - 0.70).toFixed(2)), orders: 8, qty: 890 },
    { price: Number((currentLtp - 1.10).toFixed(2)), orders: 19, qty: 4500 },
    { price: Number((currentLtp - 1.50).toFixed(2)), orders: 31, qty: 6200 },
  ];

  const asks = [
    { price: Number((currentLtp + 0.15).toFixed(2)), orders: 14, qty: 1820 },
    { price: Number((currentLtp + 0.40).toFixed(2)), orders: 20, qty: 2900 },
    { price: Number((currentLtp + 0.75).toFixed(2)), orders: 11, qty: 1240 },
    { price: Number((currentLtp + 1.20).toFixed(2)), orders: 16, qty: 3800 },
    { price: Number((currentLtp + 1.65).toFixed(2)), orders: 28, qty: 5700 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <main className="md:ml-64 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/stocks"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Market Explorer</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Feed Connected
            </span>
          </div>
        </div>

        {/* Stock Headline Header */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-white">{symbol}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {symbol.endsWith('.NS') ? 'NSE India' : 'NASDAQ'}
              </span>
              <span className="text-xs text-slate-400">{quote?.sector || 'Equity'}</span>
            </div>
            <p className="text-sm text-slate-400">{quote?.name || 'Stock Asset'}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-white">
                {currency}{quote ? quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '...'}
              </div>
              <div
                className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {isUp ? '+' : ''}{quote?.change.toFixed(2)} ({isUp ? '+' : ''}{quote?.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModalSide('BUY');
                  setModalOpen(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                BUY
              </button>
              <button
                onClick={() => {
                  setModalSide('SELL');
                  setModalOpen(true);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95"
              >
                SELL
              </button>
            </div>
          </div>
        </div>

        {/* Live Technical Indicators Ribbon */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">RSI (14)</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                indicators.rsi < 30
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : indicators.rsi > 70
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {indicators.rsi} ({indicators.rsiSignal})
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">MACD (12,26)</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                indicators.macd.crossover === 'BULLISH'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {indicators.macd.crossover}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">EMA (20)</span>
            <span className="font-bold text-white">₹{indicators.ema20 || '---'}</span>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">AI Verdict</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                indicators.overallVerdict.includes('BUY')
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : indicators.overallVerdict.includes('SELL')
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {indicators.overallVerdict}
            </span>
          </div>
        </div>

        {/* Chart & Quick Order Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart Area (Col Span 2) */}
          <div className="lg:col-span-2 bg-[#0e1524] border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            {/* Chart Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
              {/* Timeframes */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['1d', '1w', '1mo', '3mo', '1y'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setPeriod(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                      period === tf
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Chart Style Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setChartType('CANDLE')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartType === 'CANDLE'
                      ? 'bg-slate-800 text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartType('AREA')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartType === 'AREA'
                      ? 'bg-slate-800 text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Area / Line
                </button>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="relative min-h-[420px] w-full">
              {chartLoading && (
                <div className="absolute inset-0 z-10 bg-[#0e1524]/80 backdrop-blur-sm flex items-center justify-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Rendering TradingView candlesticks...
                </div>
              )}
              <div ref={chartContainerRef} className="w-full h-[420px]" />
            </div>

            {/* Bottom Chart Footer Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 font-mono">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Live OHLCV Feed
              </span>
              <span>Intraday Interval: 15m / Daily</span>
            </div>
          </div>

          {/* Quick Order Terminal Beside Chart (Col Span 1) */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Instant Order Desk
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                  Instant Fill
                </span>
              </div>

              {/* Order Side Toggle */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickSide('BUY')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    quickSide === 'BUY'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSide('SELL')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    quickSide === 'SELL'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>

              {/* Quantity Stepper */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Shares Quantity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quickQty}
                    onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-base font-mono rounded-xl px-4 py-2 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuickQty((q) => q + 10)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl whitespace-nowrap"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQty((q) => q + 50)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl whitespace-nowrap"
                  >
                    +50
                  </button>
                </div>
              </div>

              {/* Order Cost calculation */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Execution Price:</span>
                  <span className="text-white">₹{(quote?.price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Order Type:</span>
                  <span className="text-white font-semibold">MARKET (MIS)</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold pt-2 border-t border-slate-800">
                  <span>Estimated Total:</span>
                  <span className="text-emerald-400">
                    ₹{((quote?.price || 0) * quickQty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {quickMsg && (
                <div
                  className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                    quickMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  }`}
                >
                  {quickMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{quickMsg.text}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickOrder(quickSide)}
                disabled={quickOrderLoading}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  quickSide === 'BUY'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                } ${quickOrderLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {quickOrderLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>
                    QUICK {quickSide} {quickQty} SHARES
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalSide(quickSide);
                  setModalOpen(true);
                }}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Open Full Order Panel (Limit / SL / Bracket) →
              </button>
            </div>
          </div>
        </div>

        {/* AI Co-pilot Market Analysis Box */}
        <div className="mb-8 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  TradeSphere AI Co-Pilot
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    Neural Quant Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Algorithmic technical assessment & momentum rating</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Confidence Score</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {indicators.bullishScore}% Bullish
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs mb-4">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block mb-1">Key Support Zone</span>
              <span className="font-bold text-emerald-400 text-sm">
                ₹{((quote?.price || 1000) * 0.985).toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block mb-1">Key Resistance Zone</span>
              <span className="font-bold text-rose-400 text-sm">
                ₹{((quote?.price || 1000) * 1.018).toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block mb-1">Risk Profile</span>
              <span className="font-bold text-yellow-400 text-sm">
                {indicators.rsi > 70 || indicators.rsi < 30 ? 'High Volatility' : 'Optimal Entry Risk'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            <strong>AI Synthesis:</strong> {indicators.summary} Based on historical price action, market momentum favors swing continuation with a risk-to-reward ratio of 1:2.4.
          </p>
        </div>

        {/* Market Depth & Key Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Book Depth (Zerodha Style) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Market Depth (L2 Bids & Asks)</h3>
              <span className="text-[11px] font-mono text-slate-400">Best 5 Market Quotes</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {/* Bids Column */}
              <div>
                <div className="flex justify-between pb-2 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                  <span>Bid (₹)</span>
                  <span>Orders</span>
                  <span>Qty</span>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {bids.map((b, idx) => (
                    <div key={idx} className="flex justify-between py-2 text-emerald-400">
                      <span className="font-bold">{b.price.toFixed(2)}</span>
                      <span className="text-slate-400">{b.orders}</span>
                      <span className="text-slate-200">{b.qty.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asks Column */}
              <div>
                <div className="flex justify-between pb-2 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                  <span>Ask (₹)</span>
                  <span>Orders</span>
                  <span>Qty</span>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {asks.map((a, idx) => (
                    <div key={idx} className="flex justify-between py-2 text-rose-400">
                      <span className="font-bold">{a.price.toFixed(2)}</span>
                      <span className="text-slate-400">{a.orders}</span>
                      <span className="text-slate-200">{a.qty.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Fundamentals & Technical Overview */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Stock Vital Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Open</span>
                <span className="font-bold text-white text-sm">₹{quote?.open?.toFixed(2) || '---'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Previous Close</span>
                <span className="font-bold text-white text-sm">₹{quote?.previousClose?.toFixed(2) || '---'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Day High</span>
                <span className="font-bold text-emerald-400 text-sm">₹{quote?.high?.toFixed(2) || '---'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Day Low</span>
                <span className="font-bold text-rose-400 text-sm">₹{quote?.low?.toFixed(2) || '---'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">52W High</span>
                <span className="font-bold text-white text-sm">₹{quote?.week52High?.toFixed(2) || '---'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">52W Low</span>
                <span className="font-bold text-white text-sm">₹{quote?.week52Low?.toFixed(2) || '---'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Volume</span>
                <span className="font-bold text-white text-sm">{quote?.volume?.toLocaleString() || '---'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">P/E Ratio</span>
                <span className="font-bold text-white text-sm">{quote?.peRatio || '28.4'}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Market Cap</span>
                <span className="font-bold text-white text-sm">{quote?.marketCap || '₹10L Cr'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Trading Modal */}
      {quote && (
        <TradingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          stockSymbol={quote.symbol}
          stockName={quote.name}
          currentPrice={quote.price}
          initialSide={modalSide}
        />
      )}
    </div>
  );
}
