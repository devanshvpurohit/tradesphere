'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  RotateCcw,
  Zap,
  ExternalLink,
  ShieldCheck,
  PieChart,
  Activity,
  History,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  Database,
} from 'lucide-react';
import { useRealtimeTrading } from '@/hooks/useRealtimeTrading';

interface PortfolioItem {
  id: string;
  stockSymbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  profitLoss: number;
  profitLossPercent: number;
  changePercent?: number;
  productType?: 'MIS' | 'CNC';
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [balance, setBalance] = useState<number>(100000);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HOLDINGS' | 'POSITIONS' | 'ORDERS' | 'ANALYTICS'>('HOLDINGS');
  const [isResetting, setIsResetting] = useState(false);

  // Firebase Cloud Firestore Live Sync
  const {
    balance: rtdbBalance,
    positions: rtdbPositions,
    userOrders: rtdbOrders,
    liveTrades: rtdbLiveTrades,
    isConnected: rtdbConnected,
    seedSampleData,
  } = useRealtimeTrading();
  const [isSeeding, setIsSeeding] = useState(false);

  // Trading Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStock, setModalStock] = useState({
    symbol: '',
    name: '',
    price: 0,
    quantity: 0,
    side: 'BUY' as 'BUY' | 'SELL',
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // When live orders trigger in RTDB, re-sync Firestore state
  useEffect(() => {
    if (rtdbOrders.length > 0) {
      fetchPortfolio();
    }
  }, [rtdbOrders.length]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio || []);
        setBalance(data.balance ?? 100000);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedSampleData();
      soundManager.playOrderSuccess();
      toast.success('Live Demo Portfolio & Orders generated in Cloud Firestore!');
      await fetchPortfolio();
    } catch (err: any) {
      toast.error('Could not write to Firestore. Please check Firestore security rules.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetCapital = async () => {
    if (!confirm('Are you sure you want to reset your portfolio capital to ₹1,00,000 and clear all positions?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/trade/reset', { method: 'POST' });
      if (res.ok) {
        soundManager.playOrderSuccess();
        toast.success('Portfolio Ledger Reset to ₹1,00,000 Virtual Capital');
        await fetchPortfolio();
      }
    } catch {
      toast.error('Failed to reset portfolio capital');
    } finally {
      setIsResetting(false);
    }
  };

  const handleTrade = (item: PortfolioItem, side: 'BUY' | 'SELL') => {
    setModalStock({
      symbol: item.stockSymbol,
      name: `${item.stockSymbol} Position`,
      price: item.currentPrice,
      quantity: item.quantity,
      side,
    });
    setModalOpen(true);
  };

  // Combine server portfolio or live Firestore onSnapshot positions
  const effectivePortfolio: PortfolioItem[] =
    portfolio.length > 0
      ? portfolio
      : rtdbPositions.map((p) => {
          const current = p.currentPrice || p.avgPrice;
          const invested = p.avgPrice * Math.abs(p.quantity);
          const curVal = current * Math.abs(p.quantity);
          const pnl =
            p.positionType === 'SHORT'
              ? (p.avgPrice - current) * Math.abs(p.quantity)
              : (current - p.avgPrice) * Math.abs(p.quantity);
          const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
          return {
            id: `${p.symbol}`,
            stockSymbol: p.symbol,
            quantity: Math.abs(p.quantity),
            avgPrice: p.avgPrice,
            currentPrice: current,
            currentValue: curVal,
            investedValue: invested,
            profitLoss: pnl,
            profitLossPercent: pnlPct,
            productType: (p.productType as 'MIS' | 'CNC') || 'CNC',
          };
        });

  const effectiveBalance = (rtdbBalance ?? 0) > 0 ? (rtdbBalance ?? balance) : balance;
  const totalInvested =
    summary?.totalInvested ?? effectivePortfolio.reduce((acc, p) => acc + p.investedValue, 0);
  const totalCurrent =
    summary?.totalCurrent ?? effectivePortfolio.reduce((acc, p) => acc + p.currentValue, 0);
  const totalProfitLoss = summary?.totalProfitLoss ?? (totalCurrent - totalInvested);
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  const totalValue = summary?.totalValue ?? (effectiveBalance + totalCurrent);
  const isProfitable = totalProfitLoss >= 0;

  // Filter holdings (CNC) vs positions (MIS / options)
  const deliveryHoldings = effectivePortfolio.filter(
    (p) => !p.stockSymbol.includes('CE') && !p.stockSymbol.includes('PE')
  );
  const intradayPositions = effectivePortfolio.filter(
    (p) => p.stockSymbol.includes('CE') || p.stockSymbol.includes('PE')
  );

  // Asset Allocation calculation
  const equityPct = totalValue > 0 ? Math.round((totalCurrent / totalValue) * 100) : 0;
  const cashPct = 100 - equityPct;

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
                INSTITUTIONAL HOLDINGS LEDGER
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Firebase Firestore Real-time Synced</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Portfolio Terminal</h1>
            <p className="text-sm text-slate-400 mt-1">
              Live unrealized returns, margin deployment, and alpha benchmarking vs NIFTY 50.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-2"
              title="Write sample holdings (RELIANCE, TCS, INFY) to Firestore"
            >
              <Flame className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Writing to Firestore...' : 'Populate Demo Data'}</span>
            </button>
            <button
              onClick={handleResetCapital}
              disabled={isResetting}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2"
              title="Reset simulated funds to ₹1,00,000"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Capital (₹1L)</span>
            </button>
            <Link
              href="/stocks"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Market Explorer</span>
            </Link>
          </div>
        </div>

        {/* 4 Capital Oversight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Total Account Net Worth
            </span>
            <div className="text-2xl font-black font-mono text-white mb-1">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-400">Base ₹1,00,000 + Net P&L</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Cash Margin
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-3 h-3 text-amber-400" />
                Firestore Live
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mb-1">
              ₹{((rtdbBalance ?? 0) > 0 ? (rtdbBalance ?? balance) : balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              0ms sync • Ready for MIS orders
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Invested Capital
            </span>
            <div className="text-2xl font-black font-mono text-white mb-1">
              ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-400">Holdings: ₹{totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Total Unrealized P&L
            </span>
            <div className={`text-2xl font-black font-mono mb-1 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitable ? '+' : ''}₹{Math.abs(totalProfitLoss).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`px-1.5 py-0.5 rounded ${isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isProfitable ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
              </span>
              <span className="text-slate-400">Net Return</span>
            </div>
          </div>
        </div>

        {/* Interactive Tabs Header */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('HOLDINGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              activeTab === 'HOLDINGS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Holdings (Delivery CNC) [{deliveryHoldings.length}]</span>
          </button>
          <button
            onClick={() => setActiveTab('POSITIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              activeTab === 'POSITIONS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Positions (Intraday MIS & F&O) [{intradayPositions.length}]</span>
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              activeTab === 'ORDERS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>🔥 Live Firestore Stream [{rtdbPositions.length} Pos • {rtdbOrders.length} Orders]</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              activeTab === 'ANALYTICS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Asset Allocation & Alpha Benchmark</span>
          </button>
        </div>

        {/* Tab 1 & Tab 2: Holdings / Positions Grid */}
        {(activeTab === 'HOLDINGS' || activeTab === 'POSITIONS') && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  {activeTab === 'HOLDINGS' ? 'Delivery Holdings (CNC)' : 'Open Intraday Positions (MIS)'}
                </h2>
                <p className="text-xs text-slate-400">Real-time marks against exchange LTP</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Synchronizing with Firestore ledger...
              </div>
            ) : (activeTab === 'HOLDINGS' ? deliveryHoldings : intradayPositions).length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  No Active {activeTab === 'HOLDINGS' ? 'Holdings' : 'Positions'} Found
                </h3>
                <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                  Your Firestore portfolio is ready. Click below to load sample blue-chip positions (RELIANCE, TCS, INFY) or place trades on the Terminal.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Flame className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                    <span>{isSeeding ? 'Writing to Firestore...' : '⚡ Populate Demo Holdings & Orders'}</span>
                  </button>
                  <Link
                    href="/stocks"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Trade Equities</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Instrument</th>
                      <th className="pb-3 text-right">Qty</th>
                      <th className="pb-3 text-right">Avg Price</th>
                      <th className="pb-3 text-right">LTP (₹)</th>
                      <th className="pb-3 text-right">Cur. Value</th>
                      <th className="pb-3 text-right">Invested</th>
                      <th className="pb-3 text-right">P&L (₹)</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {(activeTab === 'HOLDINGS' ? deliveryHoldings : intradayPositions).map((item) => {
                      const isItemUp = item.profitLoss >= 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 pl-2">
                            <Link
                              href={`/stocks/${item.stockSymbol}`}
                              className="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5"
                            >
                              <span>{item.stockSymbol}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            </Link>
                          </td>
                          <td className="py-3.5 text-right font-bold text-slate-200">{item.quantity}</td>
                          <td className="py-3.5 text-right text-slate-400">₹{item.avgPrice.toFixed(2)}</td>
                          <td className="py-3.5 text-right font-bold text-white">₹{item.currentPrice.toFixed(2)}</td>
                          <td className="py-3.5 text-right text-slate-200">
                            ₹{item.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 text-right text-slate-400">
                            ₹{item.investedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3.5 text-right font-bold ${isItemUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isItemUp ? '+' : ''}₹{item.profitLoss.toFixed(2)}
                            <span className="block text-[10px] font-normal">
                              ({isItemUp ? '+' : ''}{item.profitLossPercent.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleTrade(item, 'BUY')}
                                className="px-2.5 py-1 text-[11px] font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition-colors"
                              >
                                + ADD MORE
                              </button>
                              <button
                                onClick={() => handleTrade(item, 'SELL')}
                                className="px-2.5 py-1 text-[11px] font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors"
                              >
                                EXIT / SQUARE OFF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Firebase Realtime Database Live Stream */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            {/* RTDB Status Bar */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Cloud Firestore Real-Time Stream
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE 0ms onSnapshot
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Synced with collections: users, portfolios, orders, transactions
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Firestore Cash</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{((rtdbBalance ?? 0) > 0 ? (rtdbBalance ?? balance) : balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Positions</span>
                  <span className="text-white font-bold">{rtdbPositions.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Trade Events</span>
                  <span className="text-white font-bold">{rtdbOrders.length}</span>
                </div>
              </div>
            </div>

            {/* RTDB Active Positions Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Realtime Synced Positions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live positions maintained in <code className="text-amber-400">portfolios/{'{userId}'}</code>
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">{rtdbPositions.length} active</span>
              </div>

              {rtdbPositions.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 font-mono">
                  No open positions currently registered in Firebase RTDB.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pl-2">Instrument</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Product</th>
                        <th className="pb-3 text-right">Qty</th>
                        <th className="pb-3 text-right">Avg Price</th>
                        <th className="pb-3 text-right">LTP</th>
                        <th className="pb-3 text-right">Live P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {rtdbPositions.map((pos) => {
                        const isShort = pos.positionType === 'SHORT';
                        const currency = pos.symbol.endsWith('.NS') ? '₹' : '$';
                        const current = pos.currentPrice || pos.avgPrice;
                        const pnl = isShort
                          ? (pos.avgPrice - current) * pos.quantity
                          : (current - pos.avgPrice) * pos.quantity;
                        const isUp = pnl >= 0;

                        return (
                          <tr key={pos.symbol} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 pl-2 font-bold text-white">
                              <Link href={`/stocks/${pos.symbol}`} className="hover:text-blue-400 flex items-center gap-1">
                                {pos.symbol}
                                <ExternalLink className="w-3 h-3 text-slate-500" />
                              </Link>
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isShort
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {pos.positionType || 'LONG'}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400 font-semibold">{pos.productType || 'MIS'}</td>
                            <td className="py-3 text-right font-bold text-slate-200">{pos.quantity}</td>
                            <td className="py-3 text-right text-slate-400">
                              {currency}{pos.avgPrice.toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-bold text-white">
                              {currency}{current.toFixed(2)}
                            </td>
                            <td className={`py-3 text-right font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isUp ? '+' : ''}{currency}{pnl.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RTDB Live Order Events Stream */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Live Order Execution Feed
                  </h3>
                  <p className="text-xs text-slate-400">
                    Broadcasted to <code className="text-emerald-400">orders/{'{userId}'}</code> and <code className="text-emerald-400">live_activity</code>
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">{rtdbOrders.length} events logged</span>
              </div>

              {rtdbOrders.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 font-mono">
                  No order events received from Firebase Realtime Database yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-none font-mono text-xs">
                  {rtdbOrders.map((ord, idx) => {
                    const isBuy = ord.side === 'BUY';
                    const isShort = ord.side === 'SHORT';
                    const currency = ord.symbol.endsWith('.NS') ? '₹' : '$';

                    return (
                      <div
                        key={ord.orderId || `rtdb-ord-${idx}`}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isShort
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ord.side}
                          </span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{ord.symbol}</span>
                              <span className="text-slate-500 font-normal">
                                {ord.quantity} shares @ {currency}{ord.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ID: {(ord.orderId || 'TXN').slice(0, 16)}... • Status: {ord.status || 'FILLED'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {ord.realizedPnL !== undefined && (
                            <div
                              className={`font-bold ${
                                ord.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {ord.realizedPnL >= 0 ? '+' : ''}{currency}{ord.realizedPnL.toFixed(2)}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {ord.timestamp ? new Date(ord.timestamp).toLocaleTimeString() : 'Live'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Asset Allocation & Alpha Benchmark Analytics */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Allocation Breakdown */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-400" />
                    Asset Allocation Split
                  </h3>
                  <span className="text-xs font-mono text-slate-400">Total: ₹{totalValue.toLocaleString('en-IN')}</span>
                </div>

                <div className="space-y-4 my-6">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300">Equities & Holdings</span>
                      <span className="text-blue-400 font-bold">{equityPct}% (₹{totalCurrent.toLocaleString('en-IN')})</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                      <div style={{ width: `${equityPct}%` }} className="h-full bg-blue-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300">Free Cash Margin</span>
                      <span className="text-emerald-400 font-bold">{cashPct}% (₹{balance.toLocaleString('en-IN')})</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                      <div style={{ width: `${cashPct}%` }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  Optimal institutional risk dictates maintaining at least 20% in unencumbered cash margin to absorb market volatility and avoid margin liquidation.
                </div>
              </div>

              {/* Alpha Comparison vs NIFTY 50 Benchmark */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Benchmark Alpha vs NIFTY 50
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Alpha: {(totalProfitLossPercent - 0.64).toFixed(2)}%</span>
                </div>

                <div className="space-y-4 my-6 font-mono text-xs">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Your Portfolio Return</span>
                      <span className={`text-base font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfitable ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">₹{totalProfitLoss.toFixed(2)}</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[11px]">NIFTY 50 Benchmark</span>
                      <span className="text-base font-bold text-blue-400">+0.64%</span>
                    </div>
                    <span className="text-xs text-slate-400">Index: 24,852.15</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  Your paper trading strategy is currently {totalProfitLossPercent >= 0.64 ? 'outperforming' : 'lagging'} the NIFTY 50 benchmark by {Math.abs(totalProfitLossPercent - 0.64).toFixed(2)} percentage points.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Trading Modal */}
      <TradingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        stockSymbol={modalStock.symbol}
        stockName={modalStock.name}
        currentPrice={modalStock.price}
        availableQuantity={modalStock.quantity}
        initialSide={modalStock.side}
        onOrderSuccess={fetchPortfolio}
      />
    </div>
  );
}
