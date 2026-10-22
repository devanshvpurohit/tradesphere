'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  Terminal,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Code2,
  Activity,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { AGENT_TEMPLATES, BacktestResult } from '@/lib/agents/engine';

export default function AgentPlayground() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('rsi_momentum');
  const [code, setCode] = useState<string>(AGENT_TEMPLATES[0].code);
  const [symbol, setSymbol] = useState<string>('RELIANCE.NS');
  const [period, setPeriod] = useState<string>('1mo');
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'TRADES' | 'API'>('CONSOLE');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = AGENT_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setCode(tmpl.code);
      toast.info(`Loaded template: ${tmpl.name}`);
    }
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          symbol,
          period,
          initialBalance: initialCapital,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
        soundManager.playOrderSuccess();

        if (data.result.netProfit > 0) {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success(`Agent Simulation Complete! Net Profit: +₹${data.result.netProfit.toLocaleString('en-IN')}`, {
            description: `Win Rate: ${data.result.winRate}% across ${data.result.totalTrades} trades.`,
          });
        } else {
          toast.info(`Simulation Complete. Net Return: ₹${data.result.netProfit.toLocaleString('en-IN')}`);
        }
      } else {
        soundManager.playOrderCancel();
        toast.error('Simulation Failed', { description: data.error || 'Check your agent script logic' });
      }
    } catch {
      soundManager.playOrderCancel();
      toast.error('Agent execution error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success('Strategy code copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isProfitable = (result?.netProfit ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <main className="md:ml-64 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-blue-500/30 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                HACKOCTOBER MLH X TECH4HACK AI TRACK
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Algorithmic Sandbox</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>AI Agent Trading Playground</span>
              <Bot className="w-7 h-7 text-blue-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Write, test, and backtest autonomous AI trading agents against real-time Indian and global market data.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className={`px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2 self-start md:self-auto ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Strategy...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Agent Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Template Selector & Config Bar */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Agent Strategy Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs rounded-xl px-3 py-2 outline-none"
            >
              {AGENT_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Target Instrument
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none"
            >
              <option value="RELIANCE.NS">RELIANCE.NS (Reliance)</option>
              <option value="TCS.NS">TCS.NS (Tata Consultancy)</option>
              <option value="HDFCBANK.NS">HDFCBANK.NS (HDFC Bank)</option>
              <option value="INFY.NS">INFY.NS (Infosys)</option>
              <option value="NVDA">NVDA (NVIDIA)</option>
              <option value="AAPL">AAPL (Apple)</option>
              <option value="TSLA">TSLA (Tesla)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Backtest Timeframe
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none"
            >
              <option value="1w">1 Week (High Frequency)</option>
              <option value="1mo">1 Month (Swing Trading)</option>
              <option value="3mo">3 Months (Medium Term)</option>
              <option value="1y">1 Year (Long Term Trend)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Initial Paper Capital (₹)
            </label>
            <input
              type="number"
              step="10000"
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseInt(e.target.value) || 100000)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs font-mono rounded-xl px-3 py-2 outline-none"
            />
          </div>
        </div>

        {/* 2-Column Playground: Editor (Left) & Results/Console (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Code Editor (7 cols) */}
          <div className="lg:col-span-7 bg-[#0d1424] border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white font-mono">strategy.ts (JavaScript/TypeScript)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-mono"
                    title="Copy code"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleSelectTemplate(selectedTemplate)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-mono"
                    title="Reset to template default"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Code Textarea Editor */}
              <div className="relative font-mono text-xs">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={20}
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-blue-500/80 rounded-xl p-4 text-emerald-300 font-mono text-xs outline-none leading-relaxed resize-y selection:bg-blue-600"
                  spellCheck={false}
                />
              </div>

              <div className="mt-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 font-mono">
                <span className="text-blue-400 font-bold block mb-1">Available Context Variables:</span>
                <span className="text-slate-300">
                  `candle` (open, high, low, close, volume) • `indicators` (rsi, macd, ema20, bollinger) • `balance` • `holding` • `buy(qty, reason)` • `sell(qty, reason)`
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Performance Analytics & Console (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* KPI Performance Cards */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Backtest Performance Scorecard
              </h3>

              {result ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold">Net P&L Return</span>
                      <div className={`text-2xl font-black font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfitable ? '+' : ''}₹{result.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                        isProfitable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isProfitable ? '+' : ''}{result.netProfitPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block mb-1">Win Rate</span>
                      <span className="text-lg font-bold text-white">{result.winRate}%</span>
                      <span className="text-[10px] text-slate-500 block">
                        ({result.winningTrades}W / {result.losingTrades}L)
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block mb-1">Total Trades</span>
                      <span className="text-lg font-bold text-white">{result.totalTrades}</span>
                      <span className="text-[10px] text-slate-500 block">Roundtrips</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block mb-1">Max Drawdown</span>
                      <span className="text-lg font-bold text-rose-400">-{result.maxDrawdown}%</span>
                      <span className="text-[10px] text-slate-500 block">Peak to Trough</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block mb-1">Sharpe Ratio</span>
                      <span className="text-lg font-bold text-blue-400">{result.sharpeRatio}</span>
                      <span className="text-[10px] text-slate-500 block">Risk-adjusted</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <span>Click &quot;Run Agent Simulation&quot; to compile and backtest your strategy.</span>
                </div>
              )}
            </div>

            {/* Output Tabs: Console vs Trades vs API */}
            <div className="flex-1 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                  <button
                    onClick={() => setActiveTab('CONSOLE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      activeTab === 'CONSOLE'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Console Output
                  </button>
                  <button
                    onClick={() => setActiveTab('TRADES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      activeTab === 'TRADES'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Trade Ledger ({result?.trades.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('API')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      activeTab === 'API'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python API
                  </button>
                </div>

                {/* Tab 1: Terminal Console */}
                {activeTab === 'CONSOLE' && (
                  <div className="h-60 overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1.5 border border-slate-800/80">
                    {result?.logs && result.logs.length > 0 ? (
                      result.logs.map((logLine, idx) => (
                        <div
                          key={idx}
                          className={
                            logLine.includes('BUY')
                              ? 'text-emerald-400 font-semibold'
                              : logLine.includes('SELL')
                              ? 'text-rose-400 font-semibold'
                              : logLine.includes('ERROR')
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }
                        >
                          {logLine}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 py-16 text-center">
                        Terminal logs will stream here during agent simulation.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Trades Log */}
                {activeTab === 'TRADES' && (
                  <div className="h-60 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
                    {result?.trades && result.trades.length > 0 ? (
                      result.trades.map((tr, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                tr.type === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {tr.type}
                            </span>
                            <div>
                              <div className="text-white font-bold">
                                {tr.quantity} @ ₹{tr.price.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500">{tr.reason}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {tr.pnl !== undefined && (
                              <div
                                className={`font-bold ${
                                  tr.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {tr.pnl >= 0 ? '+' : ''}₹{tr.pnl.toFixed(2)}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500">{tr.time}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 py-16 text-center">
                        No trades executed in this run.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Python / LangChain Bot API Integration */}
                {activeTab === 'API' && (
                  <div className="h-60 overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-2 border border-slate-800/80">
                    <span className="text-blue-400 font-bold block">Connect External Python / LangChain Bot:</span>
                    <pre className="text-slate-400 overflow-x-auto text-[10px]">
{`import requests

# 1. Fetch AI Indicators
res = requests.get("http://localhost:3000/api/ai/analyze?symbol=RELIANCE.NS")
data = res.json()
print("Sentiment:", data["aiAnalysis"]["verdict"])

# 2. Execute Automated Paper Trade
trade = requests.post(
    "http://localhost:3000/api/agents/trade",
    json={
        "symbol": "RELIANCE.NS",
        "quantity": 25,
        "side": "BUY",
        "agentName": "MyPythonBot",
        "reason": "LangChain Bullish Signal"
    }
)
print("Trade Result:", trade.json())`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
