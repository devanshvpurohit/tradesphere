'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
import {
  Search,
  TrendingUp,
  TrendingDown,
  LineChart,
  Zap,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
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

export default function MarketExplorer() {
  const [indianStocks, setIndianStocks] = useState<StockQuote[]>([]);
  const [usStocks, setUsStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INDIAN' | 'US' | 'GAINERS' | 'LOSERS'>('INDIAN');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Trading modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState({
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    price: 2982.4,
    side: 'BUY' as 'BUY' | 'SELL',
  });

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const [indRes, usRes] = await Promise.allSettled([
        fetch('/api/stocks?market=indian'),
        fetch('/api/stocks?market=us'),
      ]);

      if (indRes.status === 'fulfilled' && indRes.value.ok) {
        const indData = await indRes.value.json();
        setIndianStocks(indData.stocks || []);
      }

      if (usRes.status === 'fulfilled' && usRes.value.ok) {
        const usData = await usRes.value.json();
        setUsStocks(usData.stocks || []);
      }
    } catch (err) {
      console.error('Error fetching market stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTrade = (symbol: string, name: string, price: number, side: 'BUY' | 'SELL') => {
    setSelectedStock({ symbol, name, price, side });
    setModalOpen(true);
  };

  // Filter & tab logic
  const displayedStocks = useMemo(() => {
    let pool: StockQuote[] = [];

    if (activeTab === 'INDIAN') {
      pool = indianStocks;
    } else if (activeTab === 'US') {
      pool = usStocks;
    } else if (activeTab === 'GAINERS') {
      pool = [...indianStocks, ...usStocks].sort((a, b) => b.changePercent - a.changePercent);
    } else if (activeTab === 'LOSERS') {
      pool = [...indianStocks, ...usStocks].sort((a, b) => a.changePercent - b.changePercent);
    }

    if (!searchQuery.trim()) return pool;

    const q = searchQuery.toLowerCase().trim();
    return pool.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.sector && s.sector.toLowerCase().includes(q))
    );
  }, [activeTab, indianStocks, usStocks, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <main className="md:ml-64 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  MARKET TERMINAL
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">Live NSE & Global Quotes</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Market Explorer</h1>
              <p className="text-sm text-slate-400 mt-1">
                Analyze and execute orders with real-time exchange pricing.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, company, sector..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Market Category Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('INDIAN')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'INDIAN'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Indian Equities (NSE/BSE)
            </button>
            <button
              onClick={() => setActiveTab('US')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'US'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              US Tech Giants (NASDAQ)
            </button>
            <button
              onClick={() => setActiveTab('GAINERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'GAINERS'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Gainers</span>
            </button>
            <button
              onClick={() => setActiveTab('LOSERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'LOSERS'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Top Losers</span>
            </button>
          </div>
        </div>

        {/* Stock Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading real-time market data...
          </div>
        ) : displayedStocks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">No stocks matched &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-blue-400 hover:underline font-semibold"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedStocks.map((stock) => {
              const isPositive = stock.change >= 0;
              const currencySymbol = stock.symbol.endsWith('.NS') ? '₹' : '$';

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
                  className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg shadow-black/10 hover:shadow-black/30 flex flex-col justify-between group"
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
                    <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                        <span>52W L: {currencySymbol}{low52.toFixed(1)}</span>
                        <span className="text-slate-300 font-semibold">Range</span>
                        <span>52W H: {currencySymbol}{high52.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${range52Percent}%` }}
                          className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                      </div>
                    </div>

                    {/* Meta tags */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-5">
                      <span>{stock.sector || 'Equities'}</span>
                      <span className="font-mono">{stock.marketCap || 'Large Cap'}</span>
                    </div>
                  </div>

                  {/* Action Buttons: BUY, SELL, Chart */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleOpenTrade(stock.symbol, stock.name, stock.price, 'BUY')}
                      className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => handleOpenTrade(stock.symbol, stock.name, stock.price, 'SELL')}
                      className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 active:scale-95"
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
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Trading Modal */}
      <TradingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        stockSymbol={selectedStock.symbol}
        stockName={selectedStock.name}
        currentPrice={selectedStock.price}
        initialSide={selectedStock.side}
      />
    </div>
  );
}
