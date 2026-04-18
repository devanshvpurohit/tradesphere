# 📊 TradeSphere Multi-Source Market Data System

## Overview

TradeSphere uses a robust, production-grade market data system with automatic fallback to ensure the app never breaks due to API failures.

## 🌐 Data Sources

### Primary API: 0xramm Indian Stock API
- **Base URL**: `https://nse-api-ruby.vercel.app`
- **Coverage**: NSE (National Stock Exchange) and BSE (Bombay Stock Exchange)
- **Authentication**: No API key required
- **Advantages**: 
  - Free and open
  - Indian market focus
  - Real-time NSE/BSE data
  - No rate limits

### Secondary API: Finnhub (Fallback)
- **Base URL**: `https://finnhub.io/api/v1`
- **Coverage**: Global markets including Indian stocks
- **Authentication**: API key required
- **Advantages**:
  - Reliable global coverage
  - Comprehensive data
  - Good uptime

## 🔄 Fallback Strategy

### Automatic Failover
```
Request → Primary API
    ↓ (if fails)
Fallback → Finnhub API
    ↓ (if fails)
Return Error → "Market data unavailable"
```

### Failure Scenarios Handled
1. **Network timeout** (5 second timeout)
2. **API down** (HTTP errors)
3. **Invalid response** (malformed data)
4. **Rate limiting** (too many requests)
5. **Symbol not found** (graceful degradation)

## 📡 API Endpoints

### Primary API Endpoints

#### Get Stock Quote
```
GET /stock?symbol=RELIANCE&res=num
```

Response:
```json
{
  "symbol": "RELIANCE",
  "last_price": 2450.50,
  "change": 25.30,
  "percent_change": 1.04,
  "day_high": 2465.00,
  "day_low": 2430.00,
  "open": 2435.00,
  "previous_close": 2425.20,
  "total_traded_volume": 5234567
}
```

#### Get Multiple Stocks
```
GET /stock/list?symbols=RELIANCE,TCS,INFY&res=num
```

#### Search Stocks
```
GET /search?q=reliance
```

#### Historical Data
```
GET /stock/history?symbol=RELIANCE&period=1mo
```

### Finnhub API Endpoints

#### Get Quote
```
GET /quote?symbol=RELIANCE.NS&token=API_KEY
```

Response:
```json
{
  "c": 2450.50,  // current price
  "d": 25.30,    // change
  "dp": 1.04,    // percent change
  "h": 2465.00,  // high
  "l": 2430.00,  // low
  "o": 2435.00,  // open
  "pc": 2425.20  // previous close
}
```

#### Search
```
GET /search?q=reliance&token=API_KEY
```

#### Candle Data
```
GET /stock/candle?symbol=RELIANCE.NS&resolution=D&from=1234567890&to=1234567890&token=API_KEY
```

## 🔧 Implementation

### Market Service Architecture

```typescript
class MarketService {
  // Main methods with fallback
  async getStockPrice(symbol: string): Promise<StockPrice>
  async getStockQuote(symbol: string): Promise<StockQuote>
  async getStocks(symbols: string[]): Promise<StockPrice[]>
  async searchStocks(query: string): Promise<SearchResult[]>
  async getTimeSeries(symbol: string): Promise<TimeSeriesData[]>
  
  // Helper methods
  private async fetchFromPrimaryAPI(symbol: string)
  private async fetchFromFinnhub(symbol: string)
  private normalizePrimaryData(data: any)
  private formatSymbolForFinnhub(symbol: string)
}
```

### Data Normalization

Both APIs return different formats. We normalize to:

```typescript
interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  source: 'primary' | 'finnhub';
}

interface StockQuote extends StockPrice {
  name: string;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
}
```

### Symbol Formatting

Indian stocks need `.NS` suffix for Finnhub:
- `RELIANCE` → `RELIANCE.NS` (NSE)
- `RELIANCE` → `RELIANCE.BO` (BSE)

US stocks remain unchanged:
- `AAPL` → `AAPL`
- `MSFT` → `MSFT`

## ⚡ Caching Strategy

### In-Memory Cache
- **TTL**: 15 seconds
- **Storage**: JavaScript Map
- **Keys**: `price:SYMBOL`, `quote:SYMBOL`, `search:query`

### Cache Benefits
1. Reduces API calls
2. Improves response time
3. Prevents rate limiting
4. Better user experience

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

## 🎯 Popular Indian Stocks

Default stocks displayed:
```typescript
[
  'RELIANCE',    // Reliance Industries
  'TCS',         // Tata Consultancy Services
  'HDFCBANK',    // HDFC Bank
  'INFY',        // Infosys
  'ICICIBANK',   // ICICI Bank
  'HINDUNILVR',  // Hindustan Unilever
  'ITC',         // ITC Limited
  'SBIN',        // State Bank of India
  'BHARTIARTL',  // Bharti Airtel
  'KOTAKBANK',   // Kotak Mahindra Bank
  'LT',          // Larsen & Toubro
  'AXISBANK',    // Axis Bank
  'ASIANPAINT',  // Asian Paints
  'MARUTI',      // Maruti Suzuki
  'TITAN',       // Titan Company
]
```

## 🔐 Environment Variables

```env
# Required for fallback
FINNHUB_API_KEY=your_finnhub_api_key_here
```

Get your Finnhub API key:
1. Go to https://finnhub.io
2. Sign up for free account
3. Copy API key from dashboard
4. Add to `.env` file

## 📈 Chart Implementation

### Candlestick Charts
Using `lightweight-charts` library for professional visualization:

```typescript
const candlestickSeries = chart.addCandlestickSeries({
  upColor: '#10b981',      // Green for up days
  downColor: '#ef4444',    // Red for down days
  borderVisible: false,
  wickUpColor: '#10b981',
  wickDownColor: '#ef4444',
});
```

### Data Format
```typescript
{
  time: '2024-01-15',
  open: 2435.00,
  high: 2465.00,
  low: 2430.00,
  close: 2450.50
}
```

## 🚨 Error Handling

### Graceful Degradation
1. **Primary API fails** → Try Finnhub
2. **Both APIs fail** → Show error message
3. **Partial data** → Display what's available
4. **Invalid symbol** → Show "Stock not found"

### Error Messages
- User-friendly messages
- No technical jargon
- Actionable suggestions
- Retry options

### Example Error Handling
```typescript
try {
  const data = await marketService.getStockPrice(symbol);
  return data;
} catch (error) {
  if (error.message.includes('unavailable')) {
    // Show retry button
  } else if (error.message.includes('not found')) {
    // Show search suggestions
  }
}
```

## 🔍 Search Implementation

### Multi-Source Search
1. Try primary API search
2. If fails, use Finnhub search
3. Return combined results
4. Limit to 10 results

### Search Features
- Fuzzy matching
- Symbol and name search
- Exchange information
- Stock type (equity, ETF, etc.)

## 📊 Trading Integration

### Live Price Fetching
Always fetch fresh price before trade execution:

```typescript
// In trading modal
const currentPrice = await marketService.getStockPrice(symbol);

// Execute trade with latest price
await executeTrade(symbol, quantity, currentPrice.price);
```

### Price Validation
- Verify price is recent (< 15 seconds old)
- Check for significant price changes
- Warn user if price moved significantly

## 🧪 Testing

### Test Scenarios
1. **Primary API working** → Should use primary
2. **Primary API down** → Should fallback to Finnhub
3. **Both APIs down** → Should show error
4. **Invalid symbol** → Should handle gracefully
5. **Network timeout** → Should retry with fallback

### Manual Testing
```bash
# Test primary API
curl "https://nse-api-ruby.vercel.app/stock?symbol=RELIANCE&res=num"

# Test Finnhub
curl "https://finnhub.io/api/v1/quote?symbol=RELIANCE.NS&token=YOUR_KEY"
```

## 📱 UI Integration

### Dashboard
```typescript
const stocks = await marketService.getStocks(popularSymbols);
// Display in table
```

### Stock Detail
```typescript
const quote = await marketService.getStockQuote(symbol);
const timeSeries = await marketService.getTimeSeries(symbol);
// Display quote + chart
```

### Search
```typescript
const results = await marketService.searchStocks(query);
// Display search results
```

### Trading Panel
```typescript
const currentPrice = await marketService.getStockPrice(symbol);
// Use for order placement
```

## 🚀 Performance Optimization

### Batch Requests
Fetch multiple stocks in one call when possible:
```typescript
const stocks = await marketService.getStocks(['RELIANCE', 'TCS', 'INFY']);
```

### Parallel Requests
Use Promise.all for independent requests:
```typescript
const [quote, timeSeries] = await Promise.all([
  marketService.getStockQuote(symbol),
  marketService.getTimeSeries(symbol)
]);
```

### Request Timeout
All requests have 5-second timeout to prevent hanging.

## 🔄 Cache Management

### When to Clear Cache
- User manually refreshes
- After trade execution
- On page navigation
- After 15 seconds (automatic)

### Manual Cache Clear
```typescript
marketService.clearCache();
```

## 📚 API Rate Limits

### Primary API (0xramm)
- No documented rate limits
- Free tier
- Best effort basis

### Finnhub
- **Free tier**: 60 calls/minute
- **Paid tier**: Higher limits
- Caching helps stay within limits

## 🆘 Troubleshooting

### "Market data unavailable"
1. Check internet connection
2. Verify API keys in `.env`
3. Check API status pages
4. Try manual refresh
5. Clear cache

### Slow Loading
1. Check network speed
2. Verify cache is working
3. Check API response times
4. Consider upgrading Finnhub plan

### Wrong Data
1. Clear cache
2. Verify symbol format
3. Check API responses
4. Report to API provider

## 🔮 Future Enhancements

- [ ] Redis caching for production
- [ ] WebSocket real-time updates
- [ ] More data sources (Alpha Vantage, Yahoo Finance)
- [ ] Smart routing based on symbol
- [ ] Historical data caching
- [ ] Offline mode with last known prices
- [ ] Data quality monitoring
- [ ] Automatic API health checks

## 📖 References

- Primary API: https://github.com/0xramm/nse-api
- Finnhub Docs: https://finnhub.io/docs/api
- Lightweight Charts: https://tradingview.github.io/lightweight-charts/

---

**Built for reliability and performance** 🚀
