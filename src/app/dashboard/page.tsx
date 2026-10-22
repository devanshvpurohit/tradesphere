'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
import { useSession } from '@/components/AuthContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface PortfolioSummary {
  balance: number;
  portfolio: any[];
  summary: {
    totalInvested: number;
    totalCurrent: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    totalValue: number;
  };
}

const FEATURED_TICKERS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 2982.4, change: 1.15 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3845.0, change: -0.35 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', price: 1678.5, change: 0.42 },
  { symbol: 'INFY.NS', name: 'Infosys', price: 1824.1, change: 1.62 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 138.25, change: 2.41 },
];

export default function Dashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Trading Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState({
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    price: 2982.4,
    side: 'BUY' as 'BUY' | 'SELL',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [portRes, ordersRes] = await Promise.allSettled([
        fetch('/api/portfolio'),
        fetch('/api/trade/order'),
      ]);

      if (portRes.status === 'fulfilled' && portRes.value.ok) {
        const portData = await portRes.value.json();
        setData(portData);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const orderData = await ordersRes.value.json();
        setRecentOrders((orderData.orders || []).slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTrade = (symbol: string, name: string, price: number, side: 'BUY' | 'SELL') => {
    setSelectedStock({ symbol, name, price, side });
    setModalOpen(true);
  };

  const isProfitable = (data?.summary.totalProfitLoss ?? 0) >= 0;
  const balance = data?.balance ?? 100000;
  const totalInvested = data?.summary.totalInvested ?? 0;
  const totalCurrent = data?.summary.totalCurrent ?? 0;
  const totalValue = data?.summary.totalValue ?? (balance + totalCurrent);
  const portfolio = data?.portfolio || [];

  const cashPercent = totalValue > 0 ? (balance / totalValue) * 100 : 100;
  const equityPercent = totalValue > 0 ? (totalCurrent / totalValue) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <main className="md:ml-64 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-[#0e1626] to-blue-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PAPER TRADING TERMINAL
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Firebase Cloud Synced</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Institutional Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Welcome back, <strong className="text-slate-200">{session?.user.displayName || session?.user.email || 'Trader'}</strong>. Market is executing live orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/stocks"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Explore Markets</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Portfolio Value */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Portfolio Value</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-white mb-2">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Virtual Equity & Cash</span>
            </div>
          </div>

          {/* Card 2: Available Cash Margin */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Margin</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mb-2">
              ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Ready for orders (Up to 5x MIS)</span>
            </div>
          </div>

          {/* Card 3: Total Invested */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Invested Capital</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-white mb-2">
              ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Current value: ₹{totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Card 4: Net Profit & Loss */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unrealized P&L</span>
              <div
                className={`p-2 rounded-xl ${
                  isProfitable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {isProfitable ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div
              className={`text-2xl font-black font-mono mb-2 ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isProfitable ? '+' : ''}₹{Math.abs(data?.summary.totalProfitLoss ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span
                className={`px-1.5 py-0.5 rounded ${
                  isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isProfitable ? '+' : ''}{(data?.summary.totalProfitLossPercent ?? 0).toFixed(2)}%
              </span>
              <span className="text-slate-400">Overall return</span>
            </div>
          </div>
        </div>

        {/* Capital Allocation Bar */}
        <div className="mb-8 p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-300">Asset Allocation</span>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Cash Margin ({cashPercent.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Active Equities ({equityPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${cashPercent}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Cash: ${cashPercent.toFixed(1)}%`}
            />
            <div
              style={{ width: `${equityPercent}%` }}
              className="bg-blue-500 h-full transition-all duration-500"
              title={`Equity: ${equityPercent.toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Featured Market Movers Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Active Market Leaders</h2>
            </div>
            <Link
              href="/stocks"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              <span>View All 20+ Equities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {FEATURED_TICKERS.map((stock) => {
              const isUp = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors"
                      >
                        {stock.symbol}
                      </Link>
                      <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{stock.name}</p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isUp ? '+' : ''}{stock.change}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-sm font-mono font-bold text-white">
                      ₹{stock.price.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleOpenTrade(stock.symbol, stock.name, stock.price, 'BUY')}
                      className="text-[10px] font-bold px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-md transition-colors"
                    >
                      BUY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Holdings Table & Recent Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Holdings (Col Span 2) */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Active Portfolio Holdings</h3>
                <p className="text-xs text-slate-400">Live positions valued at real-time market prices</p>
              </div>
              <Link
                href="/portfolio"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <span>Full Portfolio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Synchronizing portfolio with Firebase...
              </div>
            ) : portfolio.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">No Active Holdings</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Your portfolio is currently empty. Use your ₹1,00,000 virtual balance to place your first trade!
                </p>
                <Link
                  href="/stocks"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Start Trading Now</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Stock</th>
                      <th className="pb-3 text-right">Qty</th>
                      <th className="pb-3 text-right">Avg Price</th>
                      <th className="pb-3 text-right">LTP</th>
                      <th className="pb-3 text-right">P&L</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {portfolio.slice(0, 5).map((item: any) => {
                      const posProfit = item.profitLoss >= 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3">
                            <Link
                              href={`/stocks/${item.stockSymbol}`}
                              className="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1"
                            >
                              <span>{item.stockSymbol}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </Link>
                          </td>
                          <td className="py-3 text-right text-slate-200">{item.quantity}</td>
                          <td className="py-3 text-right text-slate-400">
                            ₹{item.avgPrice.toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-bold text-white">
                            ₹{item.currentPrice.toFixed(2)}
                          </td>
                          <td className={`py-3 text-right font-bold ${posProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {posProfit ? '+' : ''}₹{item.profitLoss.toFixed(2)}
                            <span className="block text-[10px] font-normal">
                              ({posProfit ? '+' : ''}{item.profitLossPercent.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleOpenTrade(item.stockSymbol, item.stockSymbol, item.currentPrice, 'SELL')}
                              className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-md transition-colors"
                            >
                              Exit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Orders Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Recent Orders</h3>
                <Link
                  href="/orders"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <span>All Orders</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No orders placed in this session yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((ord: any) => {
                    const isBuy = ord.type === 'BUY';
                    return (
                      <div
                        key={ord.id}
                        className="p-3 bg-slate-950/60 border border-slate-800/70 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              isBuy ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {ord.type}
                          </span>
                          <div>
                            <div className="font-bold text-white">{ord.stockSymbol}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {ord.quantity} qty • {ord.orderType}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              ord.status === 'EXECUTED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : ord.status === 'PENDING'
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ord.status}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {ord.executedPrice ? `₹${ord.executedPrice.toFixed(2)}` : 'At Trigger'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform Security Badge */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
                Firebase Real-time Sync
              </span>
              <span className="font-mono">100% Paper Mode</span>
            </div>
          </div>
        </div>
      </main>

      {/* Trading Modal */}
      <TradingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        stockSymbol={selectedStock.symbol}
        stockName={selectedStock.name}
        currentPrice={selectedStock.price}
        initialSide={selectedStock.side}
        onOrderSuccess={fetchDashboardData}
      />
    </div>
  );
}
