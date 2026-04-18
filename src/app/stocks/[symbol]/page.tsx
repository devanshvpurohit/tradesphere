'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import TradingModal from '@/components/TradingModal';
import { createChart, ColorType } from 'lightweight-charts';

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
}

export default function StockDetail() {
  const params = useParams();
  const symbol = params.symbol as string;
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(0);

  useEffect(() => {
    fetchStockData();
    fetchPortfolio();
  }, [symbol]);

  const fetchStockData = async () => {
    try {
      const response = await fetch(`/api/stocks/${symbol}`);
      const data = await response.json();
      setQuote(data.quote);

      if (chartContainerRef.current && data.timeSeries && data.timeSeries.length > 0) {
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#ffffff' },
            textColor: '#6b7280',
          },
          grid: {
            vertLines: { color: '#f3f4f6' },
            horzLines: { color: '#f3f4f6' },
          },
          width: chartContainerRef.current.clientWidth,
          height: 400,
        });

        const lineSeries = chart.addLineSeries({
          color: '#2563eb',
          lineWidth: 2,
        });

        const chartData = data.timeSeries
          .map((item: any) => ({
            time: new Date(item.date).toISOString().split('T')[0],
            value: item.close,
          }))
          .filter((item: any) => item.value > 0);

        lineSeries.setData(chartData);

        chart.timeScale().fitContent();

        return () => {
          chart.remove();
        };
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      const holding = data.portfolio?.find((p: any) => p.stockSymbol === symbol);
      setAvailableQuantity(holding?.quantity || 0);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <TopNav />
        <div className="ml-64 pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl text-gray-900">Loading...</div>
        </div>
      </>
    );
  }

  if (!quote) {
    return (
      <>
        <Sidebar />
        <TopNav />
        <div className="ml-64 pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl text-gray-900">Stock not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <TopNav />
      <div className="ml-64 pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Stock Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-blue-600 text-3xl">show_chart</span>
                  <h1 className="text-3xl font-bold text-gray-900">{quote.symbol}</h1>
                </div>
                <p className="text-gray-600 text-lg">{quote.name}</p>
                {availableQuantity > 0 && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                    <span>You own {availableQuantity} shares</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-gray-900">₹{quote.price.toFixed(2)}</div>
                <div
                  className={`text-lg font-medium flex items-center justify-end gap-1 mt-1 ${
                    quote.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {quote.change >= 0 ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  {quote.change >= 0 ? '+' : ''}
                  {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-medium">Open</div>
                <div className="text-lg font-bold text-gray-900">₹{quote.open.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-medium">High</div>
                <div className="text-lg font-bold text-gray-900">₹{quote.high.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-medium">Low</div>
                <div className="text-lg font-bold text-gray-900">₹{quote.low.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-medium">Volume</div>
                <div className="text-lg font-bold text-gray-900">{quote.volume.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">candlestick_chart</span>
                Price Chart
              </h2>
              <div ref={chartContainerRef} />
            </div>

            {/* Quick Trade Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">swap_horiz</span>
                Quick Trade
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => setIsTradingModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  <span>Open Trading Panel</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsTradingModalOpen(true)}
                    className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>Buy</span>
                  </button>
                  <button
                    onClick={() => setIsTradingModalOpen(true)}
                    disabled={availableQuantity === 0}
                    className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all font-bold flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">trending_down</span>
                    <span>Sell</span>
                  </button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-medium">
                    Trading Features
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      <span>Market & Limit Orders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      <span>Stop Loss Orders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      <span>Intraday & Overnight</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      <span>Target & SL Options</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Modal */}
      <TradingModal
        isOpen={isTradingModalOpen}
        onClose={() => setIsTradingModalOpen(false)}
        stockSymbol={quote.symbol}
        stockName={quote.name}
        currentPrice={quote.price}
        availableQuantity={availableQuantity}
      />
    </>
  );
}
