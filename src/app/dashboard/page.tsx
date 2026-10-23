'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Search,
  LineChart,
  Activity,
  RefreshCw,
  Bot,
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

const DEFAULT_INDIAN_FALLBACK: StockQuote[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 2982.4, change: 33.8, changePercent: 1.15, high: 2995, low: 2950, open: 2955, previousClose: 2948.6, volume: 4520000, sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3845.0, change: -13.5, changePercent: -0.35, high: 3870, low: 3830, open: 3860, previousClose: 3858.5, volume: 1890000, sector: 'IT Services' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', price: 1678.5, change: 7.0, changePercent: 0.42, high: 1685, low: 1665, open: 1670, previousClose: 1671.5, volume: 8420000, sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', price: 1824.1, change: 29.1, changePercent: 1.62, high: 1835, low: 1800, open: 1805, previousClose: 1795.0, volume: 3210000, sector: 'IT Services' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', price: 1245.0, change: 11.2, changePercent: 0.91, high: 1252, low: 1235, open: 1238, previousClose: 1233.8, volume: 5600000, sector: 'Banking' },
];

export default function Dashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Live Market Leaders State
  const [indianStocks, setIndianStocks] = useState<StockQuote[]>(DEFAULT_INDIAN_FALLBACK);
  const [usStocks, setUsStocks] = useState<StockQuote[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [activeMarketTab, setActiveMarketTab] = useState<'INDIAN' | 'US' | 'GAINERS' | 'LOSERS'>('INDIAN');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

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
    fetchMarketData();

    // Auto-poll live quotes every 12 seconds
    const interval = setInterval(() => {
      fetchMarketData(false);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingMarket(true);
      const [indRes, usRes] = await Promise.allSettled([
        fetch('/api/stocks?market=indian'),
        fetch('/api/stocks?market=us'),
      ]);

      if (indRes.status === 'fulfilled' && indRes.value.ok) {
        const indData = await indRes.value.json();
        if (indData.stocks && indData.stocks.length > 0) {
          setIndianStocks(indData.stocks);
        }
      }

      if (usRes.status === 'fulfilled' && usRes.value.ok) {
        const usData = await usRes.value.json();
        if (usData.stocks && usData.stocks.length > 0) {
          setUsStocks(usData.stocks);
        }
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching market stocks for dashboard:', err);
    } finally {
      if (showLoading) setLoadingMarket(false);
    }
  };

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

  // Market filter & tab logic
  const displayedMarketLeaders = useMemo(() => {
    let pool: StockQuote[] = [];

    if (activeMarketTab === 'INDIAN') {
      pool = indianStocks;
    } else if (activeMarketTab === 'US') {
      pool = usStocks;
    } else if (activeMarketTab === 'GAINERS') {
      pool = [...indianStocks, ...usStocks].sort((a, b) => b.changePercent - a.changePercent);
    } else if (activeMarketTab === 'LOSERS') {
      pool = [...indianStocks, ...usStocks].sort((a, b) => a.changePercent - b.changePercent);
    }

    if (marketSearchQuery.trim()) {
      const q = marketSearchQuery.toLowerCase();
      pool = pool.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.sector && s.sector.toLowerCase().includes(q))
      );
    }

    return pool;
  }, [activeMarketTab, indianStocks, usStocks, marketSearchQuery]);

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

        {/* AI Agent Auto-Pilot Card */}
        <div className="mb-8 p-5 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-blue-950/40 border border-purple-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AUTONOMOUS EXECUTION ENGINE
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Trading On Your Behalf
                </span>
              </div>
              <h3 className="text-base font-bold text-white">AI Quantitative Agents & Whole-Market Auto-Pilot</h3>
              <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                Delegate trade execution to high-conviction AI agents (Quant Alpha, Momentum Scalper, Deep Value) or sweep 20+ stocks concurrently with customizable RSI/EMA rules, automatic profit booking (+2.5%), and stop-loss cutting (-1.2%).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/agents"
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              <span>Launch AI Trading Desk</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
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

        {/* Active Market Leaders Section */}
        <div className="mb-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl">
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Active Market Leaders</h2>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time NSE &amp; NASDAQ quotes with instant 1-click execution &amp; 52-week telemetry
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Search input */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter scrip (e.g. RELIANCE, NVDA)..."
                  value={marketSearchQuery}
                  onChange={(e) => setMarketSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* View all button */}
              <Link
                href="/stocks"
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all whitespace-nowrap"
              >
                <span>Full Terminal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
            <button
              onClick={() => setActiveMarketTab('INDIAN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeMarketTab === 'INDIAN'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              Indian Equities (NSE) ({indianStocks.length})
            </button>
            <button
              onClick={() => setActiveMarketTab('US')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeMarketTab === 'US'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              US Tech Giants (NASDAQ) ({usStocks.length})
            </button>
            <button
              onClick={() => setActiveMarketTab('GAINERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeMarketTab === 'GAINERS'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Gainers</span>
            </button>
            <button
              onClick={() => setActiveMarketTab('LOSERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeMarketTab === 'LOSERS'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Top Losers</span>
            </button>
          </div>

          {/* Cards Grid */}
          {loadingMarket && displayedMarketLeaders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Connecting to real-time quotes feed...
            </div>
          ) : displayedMarketLeaders.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-400 text-xs">No scrips matched &quot;{marketSearchQuery}&quot;</p>
              <button
                onClick={() => setMarketSearchQuery('')}
                className="mt-2 text-xs text-blue-400 hover:underline font-semibold"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {displayedMarketLeaders.slice(0, 10).map((stock) => {
                const isPositive = stock.change >= 0;
                const currency = stock.symbol.endsWith('.NS') ? '₹' : '$';
                const low52 = stock.week52Low || stock.price * 0.82;
                const high52 = stock.week52High || stock.price * 1.25;
                const range52Percent = Math.min(
                  100,
                  Math.max(0, ((stock.price - low52) / (high52 - low52)) * 100)
                );

                return (
                  <div
                    key={stock.symbol}
                    className="p-4 bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all group flex flex-col justify-between shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Top Header: Symbol + Exchange + Day % */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/stocks/${stock.symbol}`}
                              className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate"
                            >
                              {stock.symbol}
                            </Link>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                              {stock.symbol.endsWith('.NS') ? 'NSE' : 'NASDAQ'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5">
                            {stock.name}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Price & Change */}
                      <div className="my-2.5">
                        <div className="text-base font-extrabold font-mono text-white tracking-tight">
                          {currency}{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-semibold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}{currency}{stock.change.toFixed(2)}
                        </div>
                      </div>

                      {/* 52W Range Micro Bar */}
                      <div className="mb-3 p-2 rounded-lg bg-slate-900/90 border border-slate-800/60">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                          <span>L: {currency}{low52.toFixed(0)}</span>
                          <span className="text-[8px] text-slate-500 uppercase">52W Range</span>
                          <span>H: {currency}{high52.toFixed(0)}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${range52Percent}%` }}
                            className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenTrade(stock.symbol, stock.name, stock.price, 'BUY')}
                        className="py-1 px-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold rounded-lg transition-colors text-center"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => handleOpenTrade(stock.symbol, stock.name, stock.price, 'SELL')}
                        className="py-1 px-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-bold rounded-lg transition-colors text-center"
                      >
                        SELL
                      </button>
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-0.5"
                      >
                        <LineChart className="w-2.5 h-2.5" />
                        <span>Chart</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
