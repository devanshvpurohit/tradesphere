# 🚀 TradeSphere Upgrade Guide - Professional Trading Features

## What's New?

TradeSphere has been upgraded with a professional trading order panel inspired by Zerodha Kite! 

### New Features:
✅ Advanced order types (Market, Limit, Stop Loss)
✅ Product types (Intraday MIS, Overnight NRML)
✅ Target & Stop Loss options
✅ Auto quantity calculator
✅ Orders management page
✅ Real-time order validation
✅ Professional UI/UX

## 📋 Upgrade Steps

### Step 1: Update Database Schema

You need to add the new `Order` table and update the `Transaction` table.

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project → SQL Editor
3. Click "New Query"
4. Copy and paste this SQL:

```sql
-- Add new columns to Transaction table
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "productType" TEXT NOT NULL DEFAULT 'MIS';
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "orderType" TEXT NOT NULL DEFAULT 'MARKET';

-- Create Order table
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "productType" TEXT NOT NULL DEFAULT 'MIS',
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "triggerPrice" DOUBLE PRECISION,
    "targetPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "executedPrice" DOUBLE PRECISION,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for Order table
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");

-- Create trigger for Order updatedAt
DROP TRIGGER IF EXISTS update_order_updated_at ON "Order";
CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "Order"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Verify in Table Editor: You should see the `Order` table

#### Option B: Using Prisma

```bash
# Generate Prisma Client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push
```

### Step 2: Update Dependencies

```bash
# Install dependencies (if any new ones)
npm install

# Regenerate Prisma Client
npx prisma generate
```

### Step 3: Restart Development Server

```bash
npm run dev
```

### Step 4: Test New Features

1. Visit http://localhost:3000
2. Go to any stock detail page
3. Click "Open Trading Panel"
4. Try different order types
5. Check the new "Orders" page in sidebar

## 🎯 New Pages & Components

### 1. Trading Modal
- Location: `src/components/TradingModal.tsx`
- Opens from stock detail page
- Full-featured order placement

### 2. Orders Page
- URL: `/orders`
- View all orders (pending, executed, cancelled)
- Filter by status
- Order details and history

### 3. Updated Stock Detail Page
- New "Open Trading Panel" button
- Shows available quantity
- Quick buy/sell buttons

## 🗄️ Database Changes

### New Table: Order
Stores all orders with advanced options:
- Order types (MARKET, LIMIT, SL, SL-M)
- Product types (MIS, NRML)
- Target and stop loss prices
- Order status tracking
- Execution details

### Updated Table: Transaction
New columns:
- `productType` - MIS or NRML
- `orderType` - MARKET, LIMIT, etc.

## 🎨 UI/UX Improvements

### Color Coding
- **Green**: Buy orders, profits
- **Red**: Sell orders, losses
- **Blue**: Primary actions
- **Yellow**: Pending status

### Professional Design
- Modal-based trading interface
- Real-time calculations
- Smart validation
- Smooth animations
- Mobile responsive

## 📱 How to Use

### Place a Market Order
1. Click stock → "Open Trading Panel"
2. Select BUY or SELL
3. Choose "Market" order type
4. Enter quantity
5. Review summary
6. Click "MARKET BUY X Shares"

### Place a Limit Order
1. Open trading panel
2. Select order type: "Limit"
3. Enter limit price
4. Enter quantity
5. Submit order
6. Order executes when price condition is met

### Set Stop Loss
1. Open trading panel
2. Choose order type (Market/Limit/SL)
3. Check "Set Stop Loss"
4. Enter stop loss price
5. Submit order

### Auto Calculate Quantity
1. Open trading panel
2. Toggle to "Auto Calculate"
3. Enter investment amount
4. Quantity calculated automatically

## 🔧 API Changes

### New Endpoint: /api/trade/order
- **POST**: Place new order
- **GET**: Fetch user orders

### Updated Endpoints
- `/api/trade/buy` - Still works (legacy)
- `/api/trade/sell` - Still works (legacy)

## 🆘 Troubleshooting

### Database Migration Failed
```bash
# Reset and try again
npx prisma db push --force-reset
```

### Order Table Not Found
- Make sure you ran the SQL migration
- Check Supabase Table Editor
- Verify connection string in .env

### Trading Modal Not Opening
- Clear browser cache
- Check browser console for errors
- Ensure you're logged in

### Orders Not Showing
- Refresh the page
- Check /api/trade/order endpoint
- Verify database connection

## 📚 Documentation

- **TRADING_FEATURES.md** - Complete feature documentation
- **README.md** - Project overview
- **DEPLOYMENT.md** - Deployment guide

## 🚀 Deploy to Vercel

After upgrading locally:

```bash
# Commit changes
git add .
git commit -m "Upgrade to professional trading features"
git push

# Deploy to Vercel
vercel --prod
```

**Important**: Run the database migration SQL in your production database before deploying!

## ✅ Verification Checklist

- [ ] Database migration completed
- [ ] Order table created
- [ ] Transaction table updated
- [ ] npm install completed
- [ ] npx prisma generate completed
- [ ] App runs without errors
- [ ] Trading modal opens
- [ ] Can place market orders
- [ ] Can place limit orders
- [ ] Orders page shows orders
- [ ] Order status updates correctly

## 🎉 You're All Set!

Your TradeSphere app now has professional trading features!

**Next Steps:**
- Explore different order types
- Test limit and stop loss orders
- Check the Orders page
- Deploy to production

**Need Help?**
- Check TRADING_FEATURES.md for detailed documentation
- Review the code in src/components/TradingModal.tsx
- Check API routes in src/app/api/trade/order/

---

**Happy Trading! 📈**
