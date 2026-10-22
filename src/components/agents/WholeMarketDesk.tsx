'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Globe2,
  Play,
  Square,
  Zap,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Radio,
  Check,
} from 'lucide-react';
import {
  MarketSignalRecord,
  WholeMarketExecutionItem,
  WholeMarketScanResult,
  WHOLE_MARKET_UNIVERSE,
} from '@/lib/agents/wholeMarketTypes';

interface WholeMarketDeskProps {
  systemPrompt?: string;
  decisionRules?: string;
  onTradeExecuted?: () => void;
}

export function WholeMarketDesk({
  systemPrompt = 'You are an aggressive autonomous quantitative desk. Scan the entire market universe. Buy momentum pullbacks on oversold confluence. Short sell overbought exhaustion breakdowns. Take profit at +2.5% and stop loss at -1.2%.',
  decisionRules = '1. Buy Long on RSI < 40 + EMA crossover.\n2. Short Sell on RSI > 68.\n3. Take profit at +2.5%, stop loss at -1.2%.\n4. Sizing: MIS 5x leverage.',
  onTradeExecuted,
}: WholeMarketDeskProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(20);
  const [intervalSec, setIntervalSec] = useState(20);
  const [allowShorts, setAllowShorts] = useState(true);
  const [universeMode, setUniverseMode] = useState<'ALL' | 'INDIAN'>('ALL');

  const [scanResult, setScanResult] = useState<WholeMarketScanResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<WholeMarketExecutionItem[]>([]);
  const [activeSignals, setActiveSignals] = useState<MarketSignalRecord[]>([]);

  const runnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop runner cleanup on unmount
  useEffect(() => {
    return () => {
      if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const getActiveUniverse = () => {
    if (universeMode === 'INDIAN') {
      return WHOLE_MARKET_UNIVERSE.filter((s) => s.endsWith('.NS'));
    }
    return WHOLE_MARKET_UNIVERSE;
  };

  const executeMarketCycle = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/agents/whole-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          decisionRules,
          allowShorts,
          universe: getActiveUniverse(),
          maxAllocationPerStock: 15000,
          productType: 'MIS',
        }),
      });

      const data: WholeMarketScanResult = await res.json();
      if (res.ok && data) {
        setScanResult(data);
        setActiveSignals(data.signals || []);

        if (data.executions && data.executions.length > 0) {
          soundManager.playOrderSuccess();
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          setExecutionLogs((prev) => [...data.executions, ...prev].slice(0, 40));
          toast.success(`Autonomous Whole-Market Action`, {
            description: `Executed ${data.executions.length} orders across the market.`,
          });
          if (onTradeExecuted) onTradeExecuted();
        }
      }
    } catch (err: any) {
      console.error('Whole market cycle error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const startWholeMarketRunner = () => {
    setIsRunning(true);
    setCycleCount(1);
    setCountdown(intervalSec);
    toast.success('Whole-Market Autonomous Desk Started!', {
      description: `Continuously sweeping ${getActiveUniverse().length} stocks every ${intervalSec}s. Buying dips, shorting peaks, taking profits.`,
    });

    // Execute first cycle immediately
    executeMarketCycle();

    // Start recurring interval
    runnerTimerRef.current = setInterval(() => {
      setCycleCount((prev) => prev + 1);
      setCountdown(intervalSec);
      executeMarketCycle();
    }, intervalSec * 1000);

    // 1-second countdown display
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : intervalSec));
    }, 1000);
  };

  const stopWholeMarketRunner = () => {
    setIsRunning(false);
    if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    toast.info('Whole-Market Desk Paused', {
      description: 'Continuous trading loop stopped. Open positions remain active in portfolio.',
    });
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#0b111e] via-[#080d18] to-[#060a13] border border-blue-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/40 text-emerald-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Autonomous Whole-Market Quant Desk
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                FULL-DAY AUTOPILOT
              </span>
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Unlike single-stock bots, this agent operates across the entire equity universe simultaneously.
            It scans technical confluences, buys oversold dips, short sells overbought exhaustions (MIS 5x), and locks in target profits.
          </p>
        </div>

        {/* Start / Stop Main Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isRunning ? (
            <button
              onClick={stopWholeMarketRunner}
              className="py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black font-mono text-xs uppercase tracking-wider shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Whole-Market Desk</span>
            </button>
          ) : (
            <button
              onClick={startWholeMarketRunner}
              className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Start Whole-Market Agent (Full Day)</span>
            </button>
          )}

          <button
            onClick={executeMarketCycle}
            disabled={isScanning}
            className="py-4 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold font-mono text-xs transition-all flex items-center gap-2 disabled:opacity-50"
            title="Perform a single sweep across all stocks right now"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>{isScanning ? 'Sweeping Market...' : 'Sweep Market Once'}</span>
          </button>
        </div>
      </div>

      {/* Configuration & Status Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-5 border-b border-slate-800 text-xs font-mono relative z-10">
        {/* Runner Status */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Desk Status</div>
            <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              {isRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400">ACTIVE RUNNER</span>
                </>
              ) : (
                <span className="text-slate-400">STANDBY · READY</span>
              )}
            </div>
          </div>
          {isRunning && (
            <div className="text-right">
              <span className="text-[10px] text-slate-500">Next Sweep</span>
              <div className="text-xs font-bold text-emerald-400">{countdown}s</div>
            </div>
          )}
        </div>

        {/* Universe Scope */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Monitored Universe</div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setUniverseMode('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                universeMode === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All 20 Stocks
            </button>
            <button
              onClick={() => setUniverseMode('INDIAN')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                universeMode === 'INDIAN'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              16 Indian Bluechips
            </button>
          </div>
        </div>

        {/* Short Selling Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Intraday Shorting</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">
              {allowShorts ? 'ENABLED (MIS 5x)' : 'DISABLED'}
            </div>
          </div>
          <button
            onClick={() => setAllowShorts((prev) => !prev)}
            className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
              allowShorts ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                allowShorts ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sweep Interval */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Sweep Frequency</div>
          <select
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value={15}>15 Seconds (High Frequency)</option>
            <option value={20}>20 Seconds (Recommended)</option>
            <option value={30}>30 Seconds</option>
            <option value={60}>1 Minute (Full-Day Pace)</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column View: Left (Signals Matrix) | Right (Execution Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 relative z-10">
        {/* Left Column (7 cols): Real-Time Universe Signals Matrix */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Universe Signals Matrix ({activeSignals.length > 0 ? activeSignals.length : getActiveUniverse().length} Stocks)
              </h4>
            </div>
            {scanResult && (
              <span className="text-[11px] text-slate-400 font-mono">
                Sweep Latency: <span className="text-emerald-400 font-bold">{scanResult.latencyMs}ms</span>
              </span>
            )}
          </div>

          {activeSignals.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-mono">
              <Radio className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-pulse" />
              <div>Desk Standing By. Click &quot;Start Whole-Market Agent&quot; to sweep the universe.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
              {activeSignals.map((sig) => {
                const isBuy = sig.signal === 'BUY';
                const isShort = sig.signal === 'SHORT';
                const isExit = sig.signal === 'SELL' || sig.signal === 'COVER';

                return (
                  <div
                    key={sig.symbol}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{sig.symbol}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {sig.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-white font-bold">₹{sig.price.toFixed(2)}</span>
                        <span className={sig.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {sig.changePercent >= 0 ? '+' : ''}{sig.changePercent.toFixed(2)}%
                        </span>
                        <span>•</span>
                        <span>RSI: {sig.rsi}</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2.5">
                      {sig.activePosition !== 'NONE' && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            sig.activePosition === 'LONG'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          POS: {sig.activePosition} ({sig.holdingQuantity})
                        </span>
                      )}

                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                          isBuy
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : isShort
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                            : isExit
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sig.signal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Live Action Logs & Executions */}
        <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Execution Feed ({executionLogs.length})
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Atomic Settlement</span>
            </div>

            {executionLogs.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500 font-mono">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div>No trades triggered yet.</div>
                <div className="text-[10px] text-slate-600 mt-1">
                  The agent will record every Buy, Short, and Sell ticket here.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
                {executionLogs.map((item) => {
                  const isBuy = item.action === 'BUY';
                  const isShort = item.action === 'SHORT';
                  const isExit = item.action === 'SELL' || item.action === 'COVER';

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isShort
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {item.action} (MIS 5x)
                        </span>
                        <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                      </div>

                      <div className="font-bold text-white mb-1">
                        {item.quantity}x {item.symbol} @ ₹{item.price.toFixed(2)}
                      </div>

                      <div className="text-[11px] text-slate-400 mb-1">
                        Value: ₹{item.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        {item.marginUsed > 0 && ` • Margin: ₹${item.marginUsed.toFixed(2)}`}
                      </div>

                      {item.realizedPnL !== undefined && (
                        <div
                          className={`text-[11px] font-bold ${
                            item.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          Realized P&L: {item.realizedPnL >= 0 ? '+' : ''}₹{item.realizedPnL.toFixed(2)}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 mt-1 italic leading-tight">
                        &quot;{item.reason}&quot;
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-right">
            <Link href="/portfolio" className="text-xs font-mono text-blue-400 hover:text-blue-300">
              View All Positions in Portfolio Ledger →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
