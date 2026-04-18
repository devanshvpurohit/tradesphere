/**
 * TradeSphere Market Service
 * Using Finnhub API for stock data
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private ttl = 15000; // 15 seconds

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new Cache();

// Normalized stock data structure
export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockQuote {
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

export interface SearchResult {
  symbol: string;
  name: string;
  type?: string;
  exchange?: string;
}

export interface TimeSeriesData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class MarketService {
  /**
   * Fetch from Finnhub API with error handling
   */
  private async fetchFromFinnhub(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${FINNHUB_BASE}${endpoint}`);
    url.searchParams.append('token', FINNHUB_API_KEY!);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get stock price
   */
  async getStockPrice(symbol: string): Promise<StockPrice> {
    const cacheKey = `price:${symbol}`;
    const cached = cache.get<StockPrice>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchFromFinnhub('/quote', { symbol });
      
      if (!data || !data.c) {
        throw new Error('Invalid stock data received');
      }

      const result: StockPrice = {
        symbol,
        price: data.c,
        change: data.d || 0,
        changePercent: data.dp || 0,
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching stock price:', error);
      throw new Error('Failed to fetch stock price');
    }
  }

  /**
   * Get detailed stock quote
   */
  async getStockQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `quote:${symbol}`;
    const cached = cache.get<StockQuote>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const [quoteData, profileData] = await Promise.all([
        this.fetchFromFinnhub('/quote', { symbol }),
        this.fetchFromFinnhub('/stock/profile2', { symbol }).catch(() => null),
      ]);

      if (!quoteData || !quoteData.c) {
        throw new Error('Invalid stock data received');
      }

      const result: StockQuote = {
        symbol,
        name: profileData?.name || symbol,
        price: quoteData.c,
        change: quoteData.d || 0,
        changePercent: quoteData.dp || 0,
        high: quoteData.h || quoteData.c,
        low: quoteData.l || quoteData.c,
        open: quoteData.o || quoteData.c,
        previousClose: quoteData.pc || quoteData.c,
        volume: 0,
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching stock quote for ${symbol}:`, error);
      throw new Error('Failed to fetch stock quote');
    }
  }

  /**
   * Get multiple stocks at once
   */
  async getStocks(symbols: string[]): Promise<StockPrice[]> {
    const results: StockPrice[] = [];

    for (const symbol of symbols) {
      try {
        const stockData = await this.getStockPrice(symbol);
        results.push(stockData);
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
        // Add placeholder to prevent UI breaks
        results.push({
          symbol,
          price: 0,
          change: 0,
          changePercent: 0,
        });
      }
    }

    return results;
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(
    symbol: string,
    period: string = '1mo',
    interval: string = '1d'
  ): Promise<TimeSeriesData[]> {
    const cacheKey = `timeseries:${symbol}:${period}`;
    const cached = cache.get<TimeSeriesData[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - this.getPeriodSeconds(period);

      const data = await this.fetchFromFinnhub('/stock/candle', {
        symbol,
        resolution: 'D',
        from: from.toString(),
        to: to.toString(),
      });

      if (!data || !data.c || data.s === 'no_data') {
        console.warn(`No historical data available for ${symbol}`);
        return [];
      }

      const timeSeries: TimeSeriesData[] = [];
      for (let i = 0; i < data.t.length; i++) {
        timeSeries.push({
          date: new Date(data.t[i] * 1000),
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i],
        });
      }

      cache.set(cacheKey, timeSeries);
      return timeSeries;
    } catch (error) {
      console.error('Error fetching time series:', error);
      return [];
    }
  }

  /**
   * Search stocks
   */
  async searchStocks(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = cache.get<SearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchFromFinnhub('/search', { q: query });

      if (!data || !data.result) {
        return [];
      }

      const results = data.result.slice(0, 10).map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
        exchange: item.displaySymbol,
      }));

      cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  /**
   * Get popular stocks (mix of US and Indian)
   */
  getPopularStocks(): string[] {
    return [
      'AAPL',    // Apple
      'MSFT',    // Microsoft
      'GOOGL',   // Google
      'AMZN',    // Amazon
      'TSLA',    // Tesla
      'META',    // Meta
      'NVDA',    // NVIDIA
      'JPM',     // JPMorgan
      'V',       // Visa
      'WMT',     // Walmart
    ];
  }

  /**
   * Get top Indian stocks (NSE)
   */
  getTopIndianStocks(): string[] {
    return [
      'RELIANCE.NS',   // Reliance Industries
      'TCS.NS',        // Tata Consultancy Services
      'HDFCBANK.NS',   // HDFC Bank
      'INFY.NS',       // Infosys
      'HINDUNILVR.NS', // Hindustan Unilever
      'ICICIBANK.NS',  // ICICI Bank
      'SBIN.NS',       // State Bank of India
      'BHARTIARTL.NS', // Bharti Airtel
      'ITC.NS',        // ITC Limited
      'KOTAKBANK.NS',  // Kotak Mahindra Bank
      'LT.NS',         // Larsen & Toubro
      'AXISBANK.NS',   // Axis Bank
      'WIPRO.NS',      // Wipro
      'MARUTI.NS',     // Maruti Suzuki
      'TITAN.NS',      // Titan Company
    ];
  }

  /**
   * Convert period string to seconds
   */
  private getPeriodSeconds(period: string): number {
    const periodMap: Record<string, number> = {
      '1d': 86400,
      '5d': 432000,
      '1w': 604800,
      '1mo': 2592000,
      '3mo': 7776000,
      '6mo': 15552000,
      '1y': 31536000,
      'ytd': 31536000,
    };
    
    return periodMap[period] || 2592000; // Default to 1 month
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    cache.clear();
  }
}

export const marketService = new MarketService();
