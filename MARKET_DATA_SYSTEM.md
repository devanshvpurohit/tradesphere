# 📊 TradeSphere Market Data System

## Overview

TradeSphere uses Finnhub API for reliable, real-time stock market data with intelligent caching for optimal performance.

## 🌐 Data Source

### Finnhub API
- **Base URL**: `https://finnhub.io/api/v1`
- **Coverage**: Global markets (US, Indian, European, Asian stocks)
- **Authentication**: API key required
- **Rate Limit**: 60 calls/minute (free tier)
- **Advantages**: 
  - Reliable uptime
  - Comprehensive data
  - Real-time quotes
  - Historical data
  - Company profiles

## 📡 API Endpoints Used

### Get Stock Quote
```
GET /quote?symbol=AAPL&token=API_KEY
```

Response:
```json
{
  "c": 150.50,   // current price
  "d": 2.30,     // change
  "dp": 1.55,    // percent change
  "h": 152.00,   // high
  "l": 149.00,   // low
  "o": 149.50,   // open
  "pc": 148.20   // previous close
}
```

### Search Stocks
```
GET /search?q=apple&token=API_KEY
```

Response:
```json
{
  "result": [
    {
      "symbol": "AAPL",
      "description": "Apple Inc",
      "type": "Common Stock",
      "displaySymbol": "AAPL"
    }
  ]
}
```

### Historical Data (Candles)
```
GET /stock/candle?symbol=AAPL&resolution=D&from=1234567890&to=1234567890&token=API_KEY
```

Response:
```json
{
  "c": [150.50, 151.20, ...],  // close prices
  "h": [152.00, 153.00, ...],  // high prices
  "l": [149.00, 150.00, ...],  // low prices
  "o": [149.50, 150.50, ...],  // open prices
  "v": [1000000, 1200000, ...], // volumes
  "t": [1234567890, 1234567900, ...], // timestamps
  "s": "ok"
}
```

### Company Profile
```
GET /stock/profile2?symbol=AAPL&token=API_KEY
```

## 🔧 Implementation

### Market Service Architecture

```typescript
class MarketService {
  // Core methods
  async getStockPrice(symbol: string): Promise<StockPrice>
  async getStockQuote(symbol: string): Promise<StockQuote>
  async getStocks(symbols: string[]): Promise<StockPrice[]>
  async searchStocks(query: string): Promise<SearchResult[]>
  async getTimeSeries(symbol: string, period: string): Promise<TimeSeriesData[]>
  
  // Utility methods
  getPopularStocks(): string[]
  clearCache(): void
}
```

### Data Structures

```typescript
interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockQuote extends StockPrice {
  name: string;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
}

interface TimeSeriesData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

## ⚡ Caching Strategy

### In-Memory Cache
- **TTL**: 15 seconds
- **Storage**: JavaScript Map
- **Keys**: 
  - `price:SYMBOL` - Stock prices
  - `quote:SYMBOL` - Full quotes
  - `search:query` - Search results
  - `timeseries:SYMBOL:period` - Historical data

### Cache Benefits
1. **Reduces API calls** - Stay within rate limits
2. **Improves response time** - Instant data for cached requests
3. **Better UX** - Faster page loads
4. **Cost savings** - Fewer API calls

### Cache Implementation
```typescript
class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private ttl = 15000; // 15 seconds
  
  set<T>(key: string, data: T): void
  get<T>(key: string): T | null
  clear(): void
}
```

## 🎯 Popular Stocks

Default stocks displayed on dashboard:
```typescript
[
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
]
```

## 📈 Chart Implementation

### Candlestick Charts
Using `lightweight-charts` library:

```typescript
const candlestickSeries = chart.addCandlestickSeries({
  upColor: '#10b981',      // Green for up days
  downColor: '#ef4444',    // Red for down days
  borderVisible: false,
  wickUpColor: '#10b981',
  wickDownColor: '#ef4444',
});
```

### Chart Data Format
```typescript
{
  time: '2024-01-15',  // YYYY-MM-DD format
  open: 149.50,
  high: 152.00,
  low: 149.00,
  close: 150.50
}
```

### Time Periods Supported
- `1d` - 1 day
- `5d` - 5 days
- `1w` - 1 week
- `1mo` - 1 month (default)
- `3mo` - 3 months
- `6mo` - 6 months
- `1y` - 1 year

## 🔐 Environment Variables

Required in `.env`:
```env
FINNHUB_API_KEY=your_api_key_here
```

### Getting Your API Key
1. Go to https://finnhub.io
2. Sign up for free account
3. Navigate to Dashboard
4. Copy your API key
5. Add to `.env` file

## 🚨 Error Handling

### Timeout Handling
All requests have 10-second timeout:
```typescript
fetch(url, { signal: AbortSignal.timeout(10000) })
```

### Error Scenarios
1. **Network timeout** → Show error message
2. **Invalid API key** → Check environment variables
3. **Rate limit exceeded** → Use cached data
4. **Symbol not found** → Show "Stock not found"
5. **No historical data** → Show message, hide chart

### User-Friendly Messages
- "Failed to fetch stock price"
- "Failed to fetch stock quote"
- "Search temporarily unavailable"
- "No historical data available"

## 🔍 Search Implementation

### Features
- Fuzzy matching
- Symbol and company name search
- Stock type information
- Exchange information
- Limited to 10 results

### Example Usage
```typescript
const results = await marketService.searchStocks('apple');
// Returns: [{ symbol: 'AAPL', name: 'Apple Inc', ... }]
```

## 📊 Trading Integration

### Live Price Fetching
Always fetch fresh price before trade:

```typescript
// In trading modal
const stockPrice = await marketService.getStockPrice(symbol);

// Execute trade with latest price
await executeTrade(symbol, quantity, stockPrice.price);
```

### Price Validation
- Cache bypassed for trades (always fresh)
- Verify price is valid (> 0)
- Show current price in trading modal

## 📱 UI Integration

### Dashboard
```typescript
const stocks = await marketService.getStocks(popularSymbols);
// Display in table with prices
```

### Stock Detail Page
```typescript
const quote = await marketService.getStockQuote(symbol);
const timeSeries = await marketService.getTimeSeries(symbol, '1mo');
// Display quote info + candlestick chart
```

### Search
```typescript
const results = await marketService.searchStocks(query);
// Display search results dropdown
```

### Trading Modal
```typescript
const currentPrice = await marketService.getStockPrice(symbol);
// Use for order calculations
```

## 🚀 Performance Optimization

### Batch Requests
Fetch multiple stocks efficiently:
```typescript
const stocks = await marketService.getStocks(['AAPL', 'MSFT', 'GOOGL']);
```

### Parallel Requests
Use Promise.all for independent data:
```typescript
const [quote, timeSeries] = await Promise.all([
  marketService.getStockQuote(symbol),
  marketService.getTimeSeries(symbol)
]);
```

### Request Deduplication
Cache prevents duplicate requests within 15 seconds.

## 📊 Rate Limit Management

### Free Tier Limits
- **60 calls per minute**
- Resets every minute
- Shared across all endpoints

### Staying Within Limits
1. **Caching** - 15s cache reduces calls by ~75%
2. **Batch requests** - Fetch multiple stocks together
3. **Debouncing** - Delay search requests
4. **Smart refresh** - Only refresh visible data

### Monitoring Usage
Check response headers:
```
X-Ratelimit-Limit: 60
X-Ratelimit-Remaining: 45
X-Ratelimit-Reset: 1234567890
```

## 🧪 Testing

### Manual API Testing
```bash
# Test quote endpoint
curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY"

# Test search endpoint
curl "https://finnhub.io/api/v1/search?q=apple&token=YOUR_KEY"

# Test candle endpoint
curl "https://finnhub.io/api/v1/stock/candle?symbol=AAPL&resolution=D&from=1609459200&to=1640995200&token=YOUR_KEY"
```

### Test Scenarios
1. **Valid symbol** → Should return data
2. **Invalid symbol** → Should handle gracefully
3. **Network timeout** → Should show error
4. **Rate limit** → Should use cache
5. **No historical data** → Should handle empty response

## 🆘 Troubleshooting

### "Failed to fetch stock price"
**Causes**:
- Invalid API key
- Network issues
- Rate limit exceeded
- Invalid symbol

**Solutions**:
1. Verify `FINNHUB_API_KEY` in `.env`
2. Check internet connection
3. Wait 1 minute (rate limit reset)
4. Verify symbol format (e.g., AAPL not Apple)

### Charts Not Showing
**Causes**:
- No historical data available
- Invalid date range
- API error

**Solutions**:
1. Check browser console for errors
2. Try different stock symbol
3. Verify API key is valid
4. Check if stock has trading history

### Slow Performance
**Causes**:
- Cache not working
- Too many API calls
- Network latency

**Solutions**:
1. Verify cache is enabled
2. Check DevTools Network tab
3. Reduce number of stocks displayed
4. Consider upgrading Finnhub plan

## 🔮 Future Enhancements

- [ ] WebSocket for real-time updates
- [ ] Redis caching for production
- [ ] Multiple time period selection for charts
- [ ] Technical indicators (MA, RSI, MACD)
- [ ] Volume charts
- [ ] Comparison charts (multiple stocks)
- [ ] Export chart as image
- [ ] Custom watchlists

## 📖 References

- Finnhub API Docs: https://finnhub.io/docs/api
- Lightweight Charts: https://tradingview.github.io/lightweight-charts/
- Next.js Data Fetching: https://nextjs.org/docs/app/building-your-application/data-fetching

---

**Built for reliability and performance** 🚀
