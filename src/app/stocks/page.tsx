'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Link from 'next/link';

interface Stock {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  source?: 'primary' | 'finnhub';
}

export default function Stocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch('/api/stocks');
      const data = await response.json();
      setStocks(data.stocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Error searching stocks:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <Sidebar />
      <TopNav />
      <div className="ml-64 pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Explorer</h1>
            <p className="text-gray-600">Discover and trade stocks on NSE/BSE</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search stocks by symbol or name..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium flex items-center gap-2"
                >
                  {searching ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">search</span>
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">Search Results</div>
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <Link
                        key={`${result.symbol}-${index}`}
                        href={`/stocks/${result.symbol}`}
                        className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900">{result.symbol}</div>
                            <div className="text-sm text-gray-600">{result.name}</div>
                            {result.exchange && (
                              <div className="text-xs text-gray-500 mt-1">{result.exchange}</div>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Popular Stocks */}
          {loading ? (
            <div className="text-center py-12 text-gray-900">
              <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
              <div className="mt-4">Loading stocks...</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Popular Stocks</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stocks.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">show_chart</span>
                            <span className="text-sm font-bold text-gray-900">{stock.symbol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {stock.name || stock.symbol}
                          {stock.source && (
                            <span className="ml-2 text-xs text-gray-400">
                              ({stock.source === 'primary' ? 'NSE' : 'Global'})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {stock.price ? `₹${stock.price.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {stock.change !== null && stock.changePercent !== null ? (
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                              stock.change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              <span className="material-symbols-outlined text-xs">
                                {stock.change >= 0 ? 'arrow_upward' : 'arrow_downward'}
                              </span>
                              <span className="font-medium">
                                {stock.change >= 0 ? '+' : ''}
                                {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <Link
                            href={`/stocks/${stock.symbol}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <span>Trade</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
