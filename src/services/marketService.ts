/**
 * TradeSphere Market Service
 * Multi-source stock data system with fallback mechanism
 * Primary: 0xramm Indian Stock API (NSE/BSE)
 * Secondary: Finnhub API (Global fallback)
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const PRIMARY_API_BASE = 'https://nse-api-ruby.vercel.app';
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
  source: 'primary' | 'finnhub';
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
  source: 'primary' | 'finnhub';
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
   * Get stock price with fallback mechanism
   */
  async getStockPrice(symbol: string): Promise<StockPrice> {
    // Check cache first
    const cacheKey = `price:${symbol}`;
    const cached = cache.get<StockPrice>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try primary API first
      const primaryData = await this.fetchFromPrimaryAPI(symbol);
      if (primaryData) {
        cache.set(cacheKey, primaryData);
        return primaryData;
      }
    } catch (error) {
      console.warn(`Primary API failed for ${symbol}, falling back to Finnhub`);
    }

    // Fallback to Finnhub
    try {
      const finnhubData = await this.fetchFromFinnhub(symbol);
      cache.set(cacheKey, finnhubData);
      return finnhubData;
    } catch (error) {
      console.error(`Both APIs failed for ${symbol}:`, error);
      throw new Error('Market data unavailable. Please try again later.');
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
      // Try primary API
      const primaryQuote = await this.fetchQuoteFromPrimaryAPI(symbol);
      if (primaryQuote) {
        cache.set(cacheKey, primaryQuote);
        return primaryQuote;
      }
    } catch (error) {
      console.warn(`Primary API quote failed for ${symbol}, using Finnhub`);
    }

    // Fallback to Finnhub
    try {
      const finnhubQuote = await this.fetchQuoteFromFinnhub(symbol);
      cache.set(cacheKey, finnhubQuote);
      return finnhubQuote;
    } catch (error) {
      console.error(`Both APIs failed for quote ${symbol}:`, error);
      throw new Error('Market data unavailable. Please try again later.');
    }
  }

  /**
   * Get multiple stocks at once
   */
  async getStocks(symbols: string[]): Promise<StockPrice[]> {
    const results: StockPrice[] = [];

    // Try to fetch all from primary API first
    try {
      const symbolsParam = symbols.join(',');
      const response = await fetch(
        `${PRIMARY_API_BASE}/stock/list?symbols=${symbolsParam}&res=num`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          for (const item of data) {
            results.push(this.normalizePrimaryData(item));
          }
          return results;
        }
      }
    } catch (error) {
      console.warn('Primary API batch fetch failed, using individual calls');
    }

    // Fallback: Fetch individually
    for (const symbol of symbols) {
      try {
        const stockData = await this.getStockPrice(symbol);
        results.push(stockData);
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
        // Add placeholder data to prevent UI breaks
        results.push({
          symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          source: 'finnhub',
        });
      }
    }

    return results;
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
      // Try primary API search
      const response = await fetch(
        `${PRIMARY_API_BASE}/search?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const results = data.slice(0, 10).map((item: any) => ({
            symbol: item.symbol || item.Symbol,
            name: item.name || item.Name || item.symbol,
            type: 'stock',
            exchange: item.exchange || 'NSE',
          }));
          cache.set(cacheKey, results);
          return results;
        }
      }
    } catch (error) {
      console.warn('Primary API search failed, using Finnhub');
    }

    // Fallback to Finnhub
    try {
      const response = await fetch(
        `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.result) {
          const results = data.result.slice(0, 10).map((item: any) => ({
            symbol: item.symbol,
            name: item.description,
            type: item.type,
            exchange: item.displaySymbol,
          }));
          cache.set(cacheKey, results);
          return results;
        }
      }
    } catch (error) {
      console.error('Search failed on both APIs:', error);
    }

    return [];
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
    if (cached) {
      return cached;
    }

    try {
      // Try primary API for historical data
      const response = await fetch(
        `${PRIMARY_API_BASE}/stock/history?symbol=${symbol}&period=${period}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const timeSeries = data.map((item: any) => ({
            date: new Date(item.date || item.Date),
            open: parseFloat(item.open || item.Open || 0),
            high: parseFloat(item.high || item.High || 0),
            low: parseFloat(item.low || item.Low || 0),
            close: parseFloat(item.close || item.Close || 0),
            volume: parseInt(item.volume || item.Volume || 0),
          }));
          cache.set(cacheKey, timeSeries);
          return timeSeries;
        }
      }
    } catch (error) {
      console.warn('Primary API historical data failed, using Finnhub');
    }

    // Fallback to Finnhub
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - this.getPeriodSeconds(period);

      const response = await fetch(
        `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.c && data.s !== 'no_data') {
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
        }
      }
    } catch (error) {
      console.error('Historical data failed on both APIs:', error);
    }

    return [];
  }

  /**
   * Get popular Indian stocks
   */
  getPopularStocks(): string[] {
    return [
      'RELIANCE',
      'TCS',
      'HDFCBANK',
      'INFY',
      'ICICIBANK',
      'HINDUNILVR',
      'ITC',
      'SBIN',
      'BHARTIARTL',
      'KOTAKBANK',
      'LT',
      'AXISBANK',
      'ASIANPAINT',
      'MARUTI',
      'TITAN',
    ];
  }

  /**
   * Fetch from primary API (0xramm Indian Stock API)
   */
  private async fetchFromPrimaryAPI(symbol: string): Promise<StockPrice | null> {
    try {
      const response = await fetch(
        `${PRIMARY_API_BASE}/stock?symbol=${symbol}&res=num`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data) return null;

      return this.normalizePrimaryData(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch quote from primary API
   */
  private async fetchQuoteFromPrimaryAPI(symbol: string): Promise<StockQuote | null> {
    try {
      const response = await fetch(
        `${PRIMARY_API_BASE}/stock?symbol=${symbol}&res=num`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data) return null;

      return {
        symbol: data.symbol || symbol,
        name: data.company_name || data.name || symbol,
        price: parseFloat(data.last_price || data.price || 0),
        change: parseFloat(data.change || 0),
        changePercent: parseFloat(data.percent_change || data.pChange || 0),
        high: parseFloat(data.day_high || data.high || data.last_price || 0),
        low: parseFloat(data.day_low || data.low || data.last_price || 0),
        open: parseFloat(data.open || data.last_price || 0),
        previousClose: parseFloat(data.previous_close || data.last_price || 0),
        volume: parseInt(data.total_traded_volume || data.volume || 0),
        source: 'primary',
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch from Finnhub API
   */
  private async fetchFromFinnhub(symbol: string): Promise<StockPrice> {
    // Add .NS suffix for Indian stocks if not present
    const finnhubSymbol = this.formatSymbolForFinnhub(symbol);

    const response = await fetch(
      `${FINNHUB_BASE}/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.c) {
      throw new Error('Invalid stock data from Finnhub');
    }

    return {
      symbol: symbol,
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
      source: 'finnhub',
    };
  }

  /**
   * Fetch quote from Finnhub
   */
  private async fetchQuoteFromFinnhub(symbol: string): Promise<StockQuote> {
    const finnhubSymbol = this.formatSymbolForFinnhub(symbol);

    const [quoteData, profileData] = await Promise.all([
      fetch(
        `${FINNHUB_BASE}/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      ).then((r) => r.json()),
      fetch(
        `${FINNHUB_BASE}/stock/profile2?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      )
        .then((r) => r.json())
        .catch(() => null),
    ]);

    if (!quoteData || !quoteData.c) {
      throw new Error('Invalid stock data from Finnhub');
    }

    return {
      symbol: symbol,
      name: profileData?.name || symbol,
      price: quoteData.c,
      change: quoteData.d || 0,
      changePercent: quoteData.dp || 0,
      high: quoteData.h || quoteData.c,
      low: quoteData.l || quoteData.c,
      open: quoteData.o || quoteData.c,
      previousClose: quoteData.pc || quoteData.c,
      volume: 0,
      source: 'finnhub',
    };
  }

  /**
   * Normalize primary API data to standard format
   */
  private normalizePrimaryData(data: any): StockPrice {
    return {
      symbol: data.symbol || data.Symbol,
      price: parseFloat(data.last_price || data.price || data.lastPrice || 0),
      change: parseFloat(data.change || data.Change || 0),
      changePercent: parseFloat(data.percent_change || data.pChange || data.percentChange || 0),
      source: 'primary',
    };
  }

  /**
   * Format symbol for Finnhub (add .NS for Indian stocks)
   */
  private formatSymbolForFinnhub(symbol: string): string {
    // If already has exchange suffix, return as is
    if (symbol.includes('.')) {
      return symbol;
    }

    // Check if it's an Indian stock
    const indianStocks = this.getPopularStocks();
    if (indianStocks.includes(symbol)) {
      return `${symbol}.NS`;
    }

    // Default to US market
    return symbol;
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
