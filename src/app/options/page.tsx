'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ArrowUpDown,
  Zap,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { OptionContract, OptionChainData } from '@/lib/options/blackScholes';

export default function OptionsPage() {
  const [underlying, setUnderlying] = useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');
  const [chainData, setChainData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const spot = chainData?.underlyingPrice || (underlying === 'NIFTY' ? 24852.15 : 51215.8);

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

        {/* F&O Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Spot Underlying Index
            </span>
            <div className="text-2xl font-black font-mono text-white">
              ₹{spot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-emerald-400 font-mono mt-1 block">Live NSE Future Reference</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              PCR (Put-Call Ratio)
            </span>
            <div className="text-2xl font-black font-mono text-blue-400">
              {chainData?.pcrRatio || '1.08'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              {(chainData?.pcrRatio || 1) >= 1 ? 'Bullish / Put Bias' : 'Bearish Bias'}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Max Pain Strike
            </span>
            <div className="text-2xl font-black font-mono text-amber-400">
              {chainData?.maxPainStrike || '24,850'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Expiry Center Gravity</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Days to Expiry
            </span>
            <div className="text-2xl font-black font-mono text-white">
              {chainData?.daysToExpiry || 4} Days
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Weekly Thursday Contract</span>
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
                    <th className="py-2 text-right">OI (Open Int)</th>
                    <th className="py-2 text-right">Delta (Δ)</th>
                    <th className="py-2 text-right">Theta (θ)</th>
                    <th className="py-2 text-right pr-3 border-r border-slate-800">LTP (₹)</th>
                    <th className="py-2 px-4 bg-slate-900 text-slate-200">Price</th>
                    <th className="py-2 pl-3 text-left border-l border-slate-800">LTP (₹)</th>
                    <th className="py-2 text-left">Theta (θ)</th>
                    <th className="py-2 text-left">Delta (Δ)</th>
                    <th className="py-2 text-left">OI (Open Int)</th>
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
                          {s.call.oi.toLocaleString()}
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
                          {s.put.oi.toLocaleString()}
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
