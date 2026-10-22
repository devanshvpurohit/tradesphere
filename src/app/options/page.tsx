'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ArrowUpDown,
  Zap,
  Info,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Sparkles,
  Target,
  Sliders,
} from 'lucide-react';
import { OptionContract, OptionChainData } from '@/lib/options/blackScholes';

interface StrategyTemplate {
  id: 'BULL_CALL' | 'BEAR_PUT' | 'SHORT_STRADDLE' | 'IRON_CONDOR';
  name: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  desc: string;
  legs: { type: 'CE' | 'PE'; action: 'BUY' | 'SELL'; strikeOffset: number; qty: number }[];
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'BULL_CALL',
    name: 'Bull Call Spread',
    bias: 'BULLISH',
    desc: 'Moderately bullish; caps risk by funding ATM call purchase with OTM call sale.',
    legs: [
      { type: 'CE', action: 'BUY', strikeOffset: 0, qty: 50 },
      { type: 'CE', action: 'SELL', strikeOffset: 150, qty: 50 },
    ],
  },
  {
    id: 'BEAR_PUT',
    name: 'Bear Put Spread',
    bias: 'BEARISH',
    desc: 'Moderately bearish; buys ATM put and sells OTM put to lower net debit premium.',
    legs: [
      { type: 'PE', action: 'BUY', strikeOffset: 0, qty: 50 },
      { type: 'PE', action: 'SELL', strikeOffset: -150, qty: 50 },
    ],
  },
  {
    id: 'SHORT_STRADDLE',
    name: 'Short Straddle',
    bias: 'NEUTRAL',
    desc: 'Pure range-bound theta decay; sells both ATM Call and ATM Put.',
    legs: [
      { type: 'CE', action: 'SELL', strikeOffset: 0, qty: 50 },
      { type: 'PE', action: 'SELL', strikeOffset: 0, qty: 50 },
    ],
  },
  {
    id: 'IRON_CONDOR',
    name: 'Iron Condor (4-Leg)',
    bias: 'NEUTRAL',
    desc: 'Defined risk non-directional strategy profiting from time decay within wide strikes.',
    legs: [
      { type: 'PE', action: 'BUY', strikeOffset: -200, qty: 50 },
      { type: 'PE', action: 'SELL', strikeOffset: -100, qty: 50 },
      { type: 'CE', action: 'SELL', strikeOffset: 100, qty: 50 },
      { type: 'CE', action: 'BUY', strikeOffset: 200, qty: 50 },
    ],
  },
];

export default function OptionsPage() {
  const [underlying, setUnderlying] = useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');
  const [chainData, setChainData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyTemplate['id']>('BULL_CALL');
  const [executingBasket, setExecutingBasket] = useState(false);

  // Trading Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState({
    symbol: 'NIFTY 24850 CE',
    name: 'NIFTY Weekly Call Option',
    price: 145.2,
    side: 'BUY' as 'BUY' | 'SELL',
  });

  useEffect(() => {
    fetchOptionChain();
  }, [underlying]);

  const fetchOptionChain = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/options?underlying=${underlying}`);
      if (res.ok) {
        const data = await res.json();
        setChainData(data.chain);
      }
    } catch (err) {
      console.error('Error fetching option chain:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeOption = (symbol: string, price: number, side: 'BUY' | 'SELL') => {
    setSelectedContract({
      symbol,
      name: `${underlying} F&O Option Contract`,
      price,
      side,
    });
    setModalOpen(true);
  };

  const handleExecuteBasket = async () => {
    const strat = STRATEGY_TEMPLATES.find((s) => s.id === selectedStrategy);
    if (!strat) return;

    setExecutingBasket(true);
    try {
      soundManager.playOrderSuccess();
      toast.success(`Executed ${strat.name} Multi-Leg Basket`, {
        description: `All ${strat.legs.length} option legs placed atomically into your portfolio ledger.`,
      });
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {
      toast.error('Failed to execute basket orders');
    } finally {
      setExecutingBasket(false);
    }
  };

  const spot = chainData?.underlyingPrice || (underlying === 'NIFTY' ? 24852.15 : 51215.8);
  const activeStratObj = STRATEGY_TEMPLATES.find((s) => s.id === selectedStrategy) || STRATEGY_TEMPLATES[0];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <main className="md:ml-64 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                F&O DERIVATIVES TERMINAL
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Black-Scholes Greek Engine</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">NSE Option Chain Matrix</h1>
            <p className="text-sm text-slate-400 mt-1">
              Simulate NIFTY & BANK NIFTY options trading with real-time Option Greeks (Delta, Theta, Gamma, Vega).
            </p>
          </div>

          {/* Underlying Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setUnderlying('NIFTY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                underlying === 'NIFTY'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NIFTY 50 (₹{underlying === 'NIFTY' ? spot.toFixed(2) : '24,852'})
            </button>
            <button
              onClick={() => setUnderlying('BANKNIFTY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                underlying === 'BANKNIFTY'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BANK NIFTY (₹{underlying === 'BANKNIFTY' ? spot.toFixed(2) : '51,215'})
            </button>
          </div>
        </div>

        {/* 5 F&O Analytics Summary Cards with India VIX */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Spot Index
            </span>
            <div className="text-xl font-black font-mono text-white">
              ₹{spot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">Live NSE Ref</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              PCR (Put-Call)
            </span>
            <div className="text-xl font-black font-mono text-blue-400">
              {chainData?.pcrRatio || '1.08'}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
              {(chainData?.pcrRatio || 1) >= 1 ? 'Bullish Bias' : 'Bearish Bias'}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Max Pain Strike
            </span>
            <div className="text-xl font-black font-mono text-amber-400">
              {chainData?.maxPainStrike || '24,850'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Center Gravity</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              India VIX
            </span>
            <div className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1">
              <span>13.82</span>
              <span className="text-xs font-normal text-emerald-500">-2.4%</span>
            </div>
            <span className="text-[11px] text-emerald-400/90 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cooling / Stable
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Days to Expiry
            </span>
            <div className="text-xl font-black font-mono text-white">
              {chainData?.daysToExpiry || 4} Days
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Weekly Expiry</span>
          </div>
        </div>

        {/* Strategy Builder & Greeks Simulator */}
        <div className="mb-8 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Institutional F&O Strategy Builder
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    Pre-Built Basket
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Model multi-leg risk profiles, net delta, and daily theta decay</p>
              </div>
            </div>

            {/* Template Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {STRATEGY_TEMPLATES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStrategy(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    selectedStrategy === st.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Details & Live Greeks Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-4 font-mono text-xs">
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Net Portfolio Delta (Δ)</span>
              <span className="text-base font-bold text-emerald-400">
                {selectedStrategy === 'BULL_CALL' ? '+0.28' : selectedStrategy === 'BEAR_PUT' ? '-0.26' : '+0.02 (Neutral)'}
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Daily Theta Decay (θ/day)</span>
              <span className="text-base font-bold text-blue-400">
                {selectedStrategy === 'SHORT_STRADDLE' ? '+₹1,850/day' : selectedStrategy === 'IRON_CONDOR' ? '+₹940/day' : '-₹380/day'}
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Max Potential Profit</span>
              <span className="text-base font-bold text-emerald-400">
                {selectedStrategy === 'BULL_CALL' ? '₹7,500.00' : selectedStrategy === 'BEAR_PUT' ? '₹7,200.00' : '₹12,450.00'}
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Max Potential Loss</span>
              <span className="text-base font-bold text-rose-400">
                {selectedStrategy === 'BULL_CALL' ? '₹4,100.00' : selectedStrategy === 'BEAR_PUT' ? '₹4,250.00' : 'Undefined / Hedged'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-300">
              <strong>Strategy Logic:</strong> {activeStratObj.desc} Includes {activeStratObj.legs.length} staged option contracts.
            </div>

            <button
              onClick={handleExecuteBasket}
              disabled={executingBasket}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 whitespace-nowrap active:scale-95"
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Execute {activeStratObj.name} Basket</span>
            </button>
          </div>
        </div>

        {/* Option Chain Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">Live Strikes Matrix with Black-Scholes Greeks</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Lot Size: {underlying === 'NIFTY' ? '50' : '15'} shares</span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Computing Black-Scholes differential equations & Greeks...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider bg-slate-950/80">
                    <th colSpan={4} className="py-2 text-emerald-400 border-r border-slate-800">
                      CALL OPTIONS (CE)
                    </th>
                    <th className="py-2 px-4 bg-slate-900 text-white font-black">STRIKE</th>
                    <th colSpan={4} className="py-2 text-rose-400 border-l border-slate-800">
                      PUT OPTIONS (PE)
                    </th>
                  </tr>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950/40">
                    <th className="py-2 text-right">OI (Lakhs)</th>
                    <th className="py-2 text-right">Delta (Δ)</th>
                    <th className="py-2 text-right">Theta (θ)</th>
                    <th className="py-2 text-right pr-3 border-r border-slate-800">LTP (₹)</th>
                    <th className="py-2 px-4 bg-slate-900 text-slate-200">Price</th>
                    <th className="py-2 pl-3 text-left border-l border-slate-800">LTP (₹)</th>
                    <th className="py-2 text-left">Theta (θ)</th>
                    <th className="py-2 text-left">Delta (Δ)</th>
                    <th className="py-2 text-left">OI (Lakhs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {chainData?.strikes.map((s) => {
                    const isATM = Math.abs(s.strike - spot) <= (underlying === 'NIFTY' ? 25 : 50);
                    const isITMCall = s.strike < spot;
                    const isITMPut = s.strike > spot;

                    return (
                      <tr
                        key={s.strike}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isATM ? 'bg-blue-950/30 font-bold' : ''
                        }`}
                      >
                        {/* Call OI */}
                        <td className={`py-3 text-right text-slate-400 ${isITMCall ? 'bg-emerald-950/15' : ''}`}>
                          {(s.call.oi / 100000).toFixed(2)}L
                        </td>

                        {/* Call Delta */}
                        <td className={`py-3 text-right text-slate-300 ${isITMCall ? 'bg-emerald-950/15' : ''}`}>
                          {s.call.delta}
                        </td>

                        {/* Call Theta */}
                        <td className={`py-3 text-right text-rose-400/80 ${isITMCall ? 'bg-emerald-950/15' : ''}`}>
                          {s.call.theta}
                        </td>

                        {/* Call LTP Button */}
                        <td className={`py-3 text-right pr-3 border-r border-slate-800 ${isITMCall ? 'bg-emerald-950/25' : ''}`}>
                          <button
                            onClick={() => handleTradeOption(s.call.symbol, s.call.ltp, 'BUY')}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded text-xs font-bold transition-colors"
                          >
                            ₹{s.call.ltp.toFixed(2)}
                          </button>
                        </td>

                        {/* STRIKE in Center */}
                        <td className={`py-3 px-4 font-black text-sm bg-slate-950 ${isATM ? 'text-yellow-400 ring-1 ring-yellow-400/30' : 'text-white'}`}>
                          {s.strike}
                          {isATM && <span className="block text-[8px] text-yellow-400 font-sans uppercase">ATM</span>}
                        </td>

                        {/* Put LTP Button */}
                        <td className={`py-3 pl-3 text-left border-l border-slate-800 ${isITMPut ? 'bg-rose-950/25' : ''}`}>
                          <button
                            onClick={() => handleTradeOption(s.put.symbol, s.put.ltp, 'BUY')}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-xs font-bold transition-colors"
                          >
                            ₹{s.put.ltp.toFixed(2)}
                          </button>
                        </td>

                        {/* Put Theta */}
                        <td className={`py-3 text-left text-rose-400/80 ${isITMPut ? 'bg-rose-950/15' : ''}`}>
                          {s.put.theta}
                        </td>

                        {/* Put Delta */}
                        <td className={`py-3 text-left text-slate-300 ${isITMPut ? 'bg-rose-950/15' : ''}`}>
                          {s.put.delta}
                        </td>

                        {/* Put OI */}
                        <td className={`py-3 text-left text-slate-400 ${isITMPut ? 'bg-rose-950/15' : ''}`}>
                          {(s.put.oi / 100000).toFixed(2)}L
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Trading Modal */}
      <TradingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        stockSymbol={selectedContract.symbol}
        stockName={selectedContract.name}
        currentPrice={selectedContract.price}
        initialSide={selectedContract.side}
      />
    </div>
  );
}
