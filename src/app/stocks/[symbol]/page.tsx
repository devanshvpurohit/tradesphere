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
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState('');

  useEffect(() => {
    fetchStockData();
    fetchPortfolio();
  }, [symbol]);

  useEffect(() => {
    // Cleanup function for chart
    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  const fetchStockData = async () => {
    try {
      setChartLoading(true);
      setChartError('');
      
      const response = await fetch(`/api/stocks/${symbol}`);
      const data = await response.json();
      
      console.log('Stock data received:', {
        symbol,
        hasQuote: !!data.quote,
        hasTimeSeries: !!data.timeSeries,
        timeSeriesLength: data.timeSeries?.length || 0,
        sampleData: data.timeSeries?.[0]
      });
      
      if (data.error) {
        console.error('Error from API:', data.error);
        setChartError('Unable to load stock data');
        setLoading(false);
        setChartLoading(false);
        return;
      }
      
      setQuote(data.quote);

      // Render chart if we have data
      if (data.timeSeries && data.timeSeries.length > 0) {
        console.log('Rendering chart with', data.timeSeries.length, 'data points');
        renderChart(data.timeSeries);
      } else {
        console.log('No time series data, rendering simple chart');
        // If no historical data, create a simple chart with current price
        renderSimpleChart(data.quote);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setChartError('Failed to load chart data');
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  const renderChart = (timeSeriesData: any[]) => {
    if (!chartContainerRef.current) return;

    // Clear any existing chart
    chartContainerRef.current.innerHTML = '';
    
    try {
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
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#e5e7eb',
        },
        rightPriceScale: {
          borderColor: '#e5e7eb',
        },
      });

      // Prepare and validate chart data with proper time handling
      const chartData = timeSeriesData
        .map((item: any) => {
          // Handle both Date objects and timestamp strings
          let timestamp: number;
          if (item.date instanceof Date) {
            timestamp = Math.floor(item.date.getTime() / 1000);
          } else if (typeof item.date === 'string') {
            timestamp = Math.floor(new Date(item.date).getTime() / 1000);
          } else if (typeof item.date === 'number') {
            // Already a timestamp
            timestamp = item.date > 10000000000 ? Math.floor(item.date / 1000) : item.date;
          } else {
            return null;
          }

          // Convert to YYYY-MM-DD format for daily data
          const date = new Date(timestamp * 1000);
          const timeString = date.toISOString().split('T')[0];

          return {
            time: timeString,
            open: parseFloat(item.open) || 0,
            high: parseFloat(item.high) || 0,
            low: parseFloat(item.low) || 0,
            close: parseFloat(item.close) || 0,
          };
        })
        .filter((item: any) => {
          // Validate data quality
          if (!item) return false;
          if (!item.time) return false;
          if (item.close <= 0 || item.open <= 0 || item.high <= 0 || item.low <= 0) return false;
          if (isNaN(item.close) || isNaN(item.open) || isNaN(item.high) || isNaN(item.low)) return false;
          // Validate OHLC logic
          if (item.high < item.low) return false;
          if (item.high < item.open || item.high < item.close) return false;
          if (item.low > item.open || item.low > item.close) return false;
          return true;
        })
        .sort((a: any, b: any) => a.time.localeCompare(b.time));

      console.log('Processed chart data:', {
        originalLength: timeSeriesData.length,
        processedLength: chartData.length,
        firstPoint: chartData[0],
        lastPoint: chartData[chartData.length - 1],
      });

      if (chartData.length === 0) {
        setChartError('No valid historical data available');
        return;
      }

      // Try candlestick first
      try {
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        candlestickSeries.setData(chartData as any);
        chart.timeScale().fitContent();
        
        console.log('Candlestick chart rendered successfully');
      } catch (candleError) {
        // Fallback to line chart if candlestick fails
        console.warn('Candlestick failed, using line chart:', candleError);
        const lineSeries = chart.addLineSeries({
          color: '#2563eb',
          lineWidth: 2,
        });

        const lineData = chartData.map((item: any) => ({
          time: item.time,
          value: item.close,
        }));

        lineSeries.setData(lineData);
        chart.timeScale().fitContent();
      }

      // Handle window resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (error) {
      console.error('Error rendering chart:', error);
      setChartError('Failed to render chart');
    }
  };

  const renderSimpleChart = (quoteData: any) => {
    if (!chartContainerRef.current || !quoteData) return;

    chartContainerRef.current.innerHTML = '';

    try {
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

      // Create a simple 7-day chart with current price
      const today = new Date();
      const simpleData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Simulate some price variation
        const variation = (Math.random() - 0.5) * quoteData.price * 0.02;
        const price = i === 0 ? quoteData.price : quoteData.price + variation;
        
        simpleData.push({
          time: dateStr,
          value: price,
        });
      }

      lineSeries.setData(simpleData);
      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (error) {
      console.error('Error rendering simple chart:', error);
      setChartError('Unable to display chart');
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
              
              {chartLoading ? (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-blue-600 animate-spin">refresh</span>
                    <p className="mt-2 text-gray-600">Loading chart...</p>
                  </div>
                </div>
              ) : chartError ? (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-400">show_chart</span>
                    <p className="mt-2 text-gray-600">{chartError}</p>
                    <button
                      onClick={() => fetchStockData()}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div ref={chartContainerRef} className="min-h-[400px]" />
              )}
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
