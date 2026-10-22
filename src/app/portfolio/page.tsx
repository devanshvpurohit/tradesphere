'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
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
} from 'lucide-react';

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
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [balance, setBalance] = useState<number>(100000);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const totalInvested = summary?.totalInvested ?? 0;
  const totalCurrent = summary?.totalCurrent ?? 0;
  const totalProfitLoss = summary?.totalProfitLoss ?? 0;
  const totalProfitLossPercent = summary?.totalProfitLossPercent ?? 0;
  const totalValue = summary?.totalValue ?? (balance + totalCurrent);
  const isProfitable = totalProfitLoss >= 0;

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
                HOLDINGS & MARGIN
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Firebase Firestore Real-time Ledger</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Portfolio Terminal</h1>
            <p className="text-sm text-slate-400 mt-1">
              Review current unrealized returns, entry valuations, and position allocations.
            </p>
          </div>

          <Link
            href="/stocks"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
          >
            <Zap className="w-4 h-4" />
            <span>Discover More Stocks</span>
          </Link>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Total Account Net Worth
            </span>
            <div className="text-2xl font-black font-mono text-white mb-1">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-400">Available cash + holding equity</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Free Cash Margin
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400 mb-1">
              ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-400">Unallocated buying power</span>
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

        {/* Holdings Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Active Equity Holdings ({portfolio.length})</h2>
              <p className="text-xs text-slate-400">Live positions updated with realtime exchange prices</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading holdings from Firestore...
            </div>
          ) : portfolio.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Your Portfolio is Empty</h3>
              <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                You have not acquired any equities yet. Browse NSE/BSE stock listings to build your virtual trading portfolio.
              </p>
              <Link
                href="/stocks"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                <Zap className="w-4 h-4" />
                <span>Explore Indian Equities</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Instrument</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Avg Price</th>
                    <th className="pb-3 text-right">LTP (Current)</th>
                    <th className="pb-3 text-right">Cur. Value</th>
                    <th className="pb-3 text-right">Invested</th>
                    <th className="pb-3 text-right">P&L (₹)</th>
                    <th className="pb-3 text-right pr-2">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {portfolio.map((item) => {
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
                        <td className="py-3.5 text-right text-slate-200">₹{item.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 text-right text-slate-400">₹{item.investedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
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
                              Add
                            </button>
                            <button
                              onClick={() => handleTrade(item, 'SELL')}
                              className="px-2.5 py-1 text-[11px] font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors"
                            >
                              Exit
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
