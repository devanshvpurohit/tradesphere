# 📈 TradeSphere Trading Features

## Professional Trading Order Panel

TradeSphere now includes a professional-grade trading interface inspired by Zerodha Kite, offering advanced order types and trading options while maintaining virtual trading (no real money).

## 🎯 Features

### 1. Buy/Sell Toggle
- **BUY** (Green) - Purchase stocks
- **SELL** (Red) - Sell holdings
- Visual color coding for quick identification

### 2. Product Types
- **MIS (Intraday)** - Margin Intraday Square-off
  - Positions must be closed same day
  - Higher leverage (simulated)
- **NRML (Overnight)** - Normal delivery
  - Can hold positions overnight
  - Standard margin requirements

### 3. Order Types

#### ✅ Market Order
- Executes immediately at current market price
- Default and fastest execution
- Best for liquid stocks

#### ✅ Limit Order
- Execute only at specified price or better
- **BUY**: Executes when price ≤ limit price
- **SELL**: Executes when price ≥ limit price
- Provides price protection

#### ✅ Stop Loss (SL) Order
- Triggers when price reaches trigger price
- Then executes as limit order
- Protects against adverse price movements

#### ✅ Stop Loss Market (SL-M) Order
- Triggers when price reaches trigger price
- Then executes as market order
- Faster execution after trigger

### 4. Advanced Options

#### Target Price
- Optional profit-taking level
- Stored for future automation
- Visual indicator in order summary

#### Stop Loss
- Optional loss-limiting level
- Risk management tool
- Helps protect capital

### 5. Quantity Selection

#### Fixed Mode
- Manual quantity input
- +/- buttons for quick adjustment
- Direct number entry

#### Auto Calculate Mode
- Enter desired investment amount
- Automatically calculates quantity
- Updates in real-time with price changes

### 6. Live Calculation Panel
Real-time display of:
- **Quantity** × **Price**
- **Total Cost**
- **Available Balance**
- **Remaining Balance** (after order)
- Color-coded warnings for insufficient funds

### 7. Order Summary
Before placing order, review:
- Quantity and price
- Total investment/proceeds
- Margin required (same as cost for MVP)
- Balance impact

### 8. Smart Validation
- Insufficient balance detection
- Insufficient shares validation
- Invalid price checks
- Real-time error messages

## 🗄️ Database Schema

### Order Table
```sql
Order {
  id              String
  userId          String
  stockSymbol     String
  type            String    // BUY or SELL
  orderType       String    // MARKET, LIMIT, SL, SL-M
  productType     String    // MIS or NRML
  quantity        Int
  price           Float?    // For LIMIT orders
  triggerPrice    Float?    // For SL orders
  targetPrice     Float?    // Optional target
  stopLoss        Float?    // Optional stop loss
  status          String    // PENDING, EXECUTED, CANCELLED, REJECTED
  executedPrice   Float?
  executedAt      DateTime?
  createdAt       DateTime
  updatedAt       DateTime
}
```

### Transaction Table (Updated)
```sql
Transaction {
  id              String
  userId          String
  stockSymbol     String
  type            String
  quantity        Int
  price           Float
  productType     String    // NEW: MIS or NRML
  orderType       String    // NEW: MARKET, LIMIT, etc.
  createdAt       DateTime
}
```

## 🎨 UI Components

### TradingModal Component
Location: `src/components/TradingModal.tsx`

Features:
- Modal-based interface
- Responsive design
- Real-time calculations
- Form validation
- Success/error messaging
- Smooth animations

### Orders Page
Location: `src/app/orders/page.tsx`

Features:
- View all orders
- Filter by status (ALL, PENDING, EXECUTED, CANCELLED)
- Order details display
- Status badges
- Execution timestamps

## 🔧 API Endpoints

### POST /api/trade/order
Place a new order

**Request Body:**
```json
{
  "symbol": "AAPL",
  "quantity": 10,
  "orderSide": "BUY",
  "orderType": "LIMIT",
  "productType": "MIS",
  "limitPrice": 150.00,
  "triggerPrice": null,
  "targetPrice": 160.00,
  "stopLoss": 145.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "orderId": "uuid"
}
```

### GET /api/trade/order
Fetch user's orders

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "stockSymbol": "AAPL",
      "type": "BUY",
      "orderType": "MARKET",
      "status": "EXECUTED",
      ...
    }
  ]
}
```

## 🧠 Business Logic

### Market Order Execution
1. Validate user balance/holdings
2. Get current market price
3. Execute transaction immediately
4. Update portfolio
5. Create transaction record
6. Create order record with EXECUTED status

### Limit Order Execution
1. Check if current price meets condition
2. If YES: Execute as market order
3. If NO: Create PENDING order
4. Order will execute when price condition is met

### Stop Loss Order Execution
1. Check if trigger price is reached
2. If YES: Execute at limit price (SL) or market price (SL-M)
3. If NO: Create PENDING order
4. Monitor for trigger condition

### Order Validation
- **BUY**: Check sufficient balance
- **SELL**: Check sufficient holdings
- **LIMIT**: Validate limit price > 0
- **SL**: Validate trigger price > 0

## 📱 User Experience

### Color Coding
- **Green**: Buy orders, profits, positive changes
- **Red**: Sell orders, losses, negative changes
- **Blue**: Primary actions, information
- **Yellow**: Pending status, warnings

### Responsive Design
- Desktop: Full-width modal with all options
- Tablet: Optimized layout
- Mobile: Stacked layout, touch-friendly

### Animations
- Smooth modal transitions
- Button hover effects
- Loading states
- Success/error animations

## 🚀 Usage Example

### Basic Market Order
1. Click stock symbol
2. Click "Open Trading Panel"
3. Select BUY or SELL
4. Choose MARKET order type
5. Enter quantity
6. Review summary
7. Click "MARKET BUY X Shares"

### Advanced Limit Order with SL
1. Open trading panel
2. Select BUY
3. Choose LIMIT order type
4. Enter limit price
5. Enable "Set Stop Loss"
6. Enter stop loss price
7. Review and submit

## 🔒 Security & Validation

- Server-side validation
- Session-based authentication
- Transaction atomicity
- Balance verification
- Holdings verification
- Price validation

## 📊 Future Enhancements

- [ ] Real-time order matching engine
- [ ] Bracket orders (OCO - One Cancels Other)
- [ ] Trailing stop loss
- [ ] Good Till Cancelled (GTC) orders
- [ ] After Market Orders (AMO)
- [ ] Order modification
- [ ] Bulk order placement
- [ ] Order book visualization
- [ ] Trade analytics
- [ ] P&L tracking per order

## 🆘 Troubleshooting

### Order not executing
- Check balance for BUY orders
- Check holdings for SELL orders
- Verify price conditions for LIMIT/SL orders

### Modal not opening
- Ensure user is logged in
- Check browser console for errors
- Verify stock data is loaded

### Balance not updating
- Refresh page after order execution
- Check transaction history
- Verify order status in Orders page

## 📚 Documentation

- **SETUP_INSTRUCTIONS.md** - Setup guide
- **DEPLOYMENT.md** - Deployment guide
- **README.md** - Project overview

---

**Built with ❤️ for realistic trading simulation**
