# 🔄 Market Data System Upgrade Guide

## What Changed?

TradeSphere now uses a **multi-source market data system** with automatic fallback for maximum reliability.

### Before
- Single API (Finnhub only)
- App breaks if API fails
- Limited Indian stock support

### After
- **Primary**: 0xramm Indian Stock API (NSE/BSE)
- **Secondary**: Finnhub (Global fallback)
- Automatic failover
- 15-second caching
- Never breaks due to API issues

## 🚀 Quick Start

### Step 1: No Code Changes Needed!

The upgrade is **backward compatible**. Your existing code will work automatically.

### Step 2: Environment Variables

Make sure you have Finnhub API key in `.env`:

```env
FINNHUB_API_KEY=d7hjqjhr01qhiu0bssb0d7hjqjhr01qhiu0bssbg
```

### Step 3: Test the System

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000 and:
1. Check Dashboard - Should show Indian stocks
2. Search for "Reliance" - Should work
3. View stock details - Should show candlestick chart
4. Try trading - Should fetch live prices

## 📊 New Features

### 1. Indian Stock Support (Primary)
- NSE (National Stock Exchange)
- BSE (Bombay Stock Exchange)
- Real-time Indian market data
- No API key required for primary source

### 2. Automatic Fallback
```
User Request
    ↓
Try Primary API (0xramm)
    ↓ (if fails)
Try Finnhub API
    ↓ (if fails)
Show Error Message
```

### 3. Smart Caching
- 15-second cache
- Reduces API calls
- Faster response times
- Prevents rate limiting

### 4. Better Charts
- Candlestick visualization
- Green/Red color coding
- OHLC data display
- Professional appearance

### 5. Source Indicator
Stocks now show their data source:
- **(NSE)** - From Indian Stock API
- **(Global)** - From Finnhub

## 🔧 API Changes

### Old Way (Still Works)
```typescript
const quote = await marketService.getStockQuote('AAPL');
```

### New Features Available
```typescript
// Batch fetch (more efficient)
const stocks = await marketService.getStocks(['RELIANCE', 'TCS', 'INFY']);

// Search with fallback
const results = await marketService.searchStocks('reliance');

// Get time series for charts
const data = await marketService.getTimeSeries('RELIANCE', '1mo');

// Clear cache manually
marketService.clearCache();
```

## 📈 Popular Indian Stocks

Now showing by default:
- RELIANCE (Reliance Industries)
- TCS (Tata Consultancy Services)
- HDFCBANK (HDFC Bank)
- INFY (Infosys)
- ICICIBANK (ICICI Bank)
- HINDUNILVR (Hindustan Unilever)
- ITC (ITC Limited)
- SBIN (State Bank of India)
- BHARTIARTL (Bharti Airtel)
- KOTAKBANK (Kotak Mahindra Bank)
- And more...

## 🎨 UI Improvements

### Candlestick Charts
- Green candles = Price up
- Red candles = Price down
- Shows OHLC (Open, High, Low, Close)
- Better for technical analysis

### Source Badges
Stocks now show where data comes from:
```
RELIANCE (NSE)  ← From Indian API
AAPL (Global)   ← From Finnhub
```

### Error Messages
More user-friendly:
- "Market data temporarily unavailable"
- "Please try again later"
- Retry buttons

## 🔍 Testing the Fallback

### Test Primary API
```bash
curl "https://nse-api-ruby.vercel.app/stock?symbol=RELIANCE&res=num"
```

Should return Indian stock data.

### Test Finnhub Fallback
```bash
curl "https://finnhub.io/api/v1/quote?symbol=RELIANCE.NS&token=YOUR_KEY"
```

Should return global market data.

### Test in App
1. Open DevTools Console
2. Watch network requests
3. See which API is being used
4. Check for fallback messages

## 🚨 Troubleshooting

### "Market data unavailable"
**Cause**: Both APIs failed

**Solutions**:
1. Check internet connection
2. Verify Finnhub API key in `.env`
3. Check API status:
   - Primary: https://nse-api-ruby.vercel.app/health
   - Finnhub: https://finnhub.io/status
4. Try manual refresh
5. Clear cache: `marketService.clearCache()`

### Slow Loading
**Cause**: API response time

**Solutions**:
1. Cache is working (15s TTL)
2. Use batch requests when possible
3. Check network speed
4. Consider Redis for production

### Wrong Stock Data
**Cause**: Cache or API issue

**Solutions**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Clear app cache: `marketService.clearCache()`
4. Check symbol format (RELIANCE vs RELIANCE.NS)

### Charts Not Showing
**Cause**: No historical data

**Solutions**:
1. Check if stock has trading history
2. Try different time period
3. Verify API response in DevTools
4. Check console for errors

## 📊 Performance Tips

### 1. Use Batch Requests
```typescript
// ❌ Bad: Multiple individual requests
const stock1 = await marketService.getStockPrice('RELIANCE');
const stock2 = await marketService.getStockPrice('TCS');
const stock3 = await marketService.getStockPrice('INFY');

// ✅ Good: Single batch request
const stocks = await marketService.getStocks(['RELIANCE', 'TCS', 'INFY']);
```

### 2. Leverage Caching
Data is cached for 15 seconds. Repeated requests within this window are instant.

### 3. Parallel Requests
```typescript
const [quote, timeSeries] = await Promise.all([
  marketService.getStockQuote(symbol),
  marketService.getTimeSeries(symbol)
]);
```

## 🔐 Security Notes

### API Keys
- Finnhub key is server-side only
- Never exposed to frontend
- Stored in `.env` file
- Not committed to Git

### Rate Limiting
- Primary API: No limits
- Finnhub: 60 calls/minute (free tier)
- Caching helps stay within limits

## 🚀 Deploy to Production

### Vercel Deployment

1. **Add Environment Variable**:
   ```
   FINNHUB_API_KEY=your_key_here
   ```

2. **Deploy**:
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

3. **Verify**:
   - Check logs for API calls
   - Test fallback mechanism
   - Monitor error rates

### Environment Variables Needed
```env
# Database
DATABASE_URL=your_supabase_url
DIRECT_URL=your_direct_url

# Auth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-app.vercel.app

# Market Data
FINNHUB_API_KEY=your_finnhub_key

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 📚 Documentation

- **MARKET_DATA_SYSTEM.md** - Complete technical documentation
- **TRADING_FEATURES.md** - Trading features guide
- **README.md** - Project overview

## ✅ Verification Checklist

After upgrade, verify:

- [ ] Dashboard loads with Indian stocks
- [ ] Stock search works
- [ ] Stock details page shows candlestick chart
- [ ] Trading modal fetches live prices
- [ ] Source indicator shows (NSE/Global)
- [ ] Fallback works (test by blocking primary API)
- [ ] Cache works (check DevTools Network tab)
- [ ] No console errors
- [ ] Charts render correctly
- [ ] Trading executes with correct prices

## 🎉 Benefits

### For Users
- ✅ More reliable (never breaks)
- ✅ Faster (caching)
- ✅ Better Indian stock support
- ✅ Professional charts
- ✅ Real-time data

### For Developers
- ✅ Clean API abstraction
- ✅ Easy to add more sources
- ✅ Built-in error handling
- ✅ Comprehensive logging
- ✅ Type-safe interfaces

## 🔮 Future Enhancements

Planned improvements:
- [ ] Redis caching for production
- [ ] WebSocket real-time updates
- [ ] More data sources (Alpha Vantage, Yahoo Finance)
- [ ] Smart routing based on symbol
- [ ] Offline mode with last known prices
- [ ] Data quality monitoring

## 🆘 Need Help?

1. Check **MARKET_DATA_SYSTEM.md** for technical details
2. Review code in `src/services/marketService.ts`
3. Check API routes in `src/app/api/stocks/`
4. Test APIs manually with curl
5. Check browser DevTools console

---

**Your app is now more reliable and production-ready!** 🚀📈
