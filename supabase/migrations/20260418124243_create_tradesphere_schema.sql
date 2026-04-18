/*
  # TradeSphere Schema Migration

  ## Summary
  Creates the full TradeSphere database schema with all required tables.

  ## New Tables
  - `User` - User accounts with email, hashed password, and virtual balance
  - `Portfolio` - User stock holdings (symbol, quantity, average buy price)
  - `Transaction` - Trading history (buy/sell records)
  - `Order` - Advanced order records (market, limit, stop-loss orders)

  ## Security
  - RLS enabled on all tables
  - Users can only read/write their own data
  - Authenticated-only access

  ## Notes
  1. Balance defaults to 100,000 (virtual ₹1,00,000)
  2. Portfolio has unique constraint per user+symbol
  3. Orders support PENDING, EXECUTED, CANCELLED, REJECTED statuses
  4. Triggers auto-update updatedAt timestamps
*/

-- =============================================
-- User table
-- =============================================
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  balance DOUBLE PRECISION NOT NULL DEFAULT 100000,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON "User" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data"
  ON "User" FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can insert own data"
  ON "User" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- =============================================
-- Portfolio table
-- =============================================
CREATE TABLE IF NOT EXISTS "Portfolio" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "stockSymbol" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "avgPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Portfolio_userId_stockSymbol_key" UNIQUE ("userId", "stockSymbol")
);

CREATE INDEX IF NOT EXISTS "Portfolio_userId_idx" ON "Portfolio"("userId");

ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own portfolio"
  ON "Portfolio" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own portfolio"
  ON "Portfolio" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own portfolio"
  ON "Portfolio" FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own portfolio"
  ON "Portfolio" FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");

-- =============================================
-- Transaction table
-- =============================================
CREATE TABLE IF NOT EXISTS "Transaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "stockSymbol" TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  "productType" TEXT NOT NULL DEFAULT 'MIS',
  "orderType" TEXT NOT NULL DEFAULT 'MARKET',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");

ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON "Transaction" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own transactions"
  ON "Transaction" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

-- =============================================
-- Order table
-- =============================================
CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "stockSymbol" TEXT NOT NULL,
  type TEXT NOT NULL,
  "orderType" TEXT NOT NULL,
  "productType" TEXT NOT NULL DEFAULT 'MIS',
  quantity INTEGER NOT NULL,
  price DOUBLE PRECISION,
  "triggerPrice" DOUBLE PRECISION,
  "targetPrice" DOUBLE PRECISION,
  "stopLoss" DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "executedPrice" DOUBLE PRECISION,
  "executedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"(status);
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");

ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON "Order" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own orders"
  ON "Order" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own orders"
  ON "Order" FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- =============================================
-- updatedAt trigger function
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_updated_at ON "Portfolio";
CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON "Portfolio"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_updated_at ON "Order";
CREATE TRIGGER update_order_updated_at
  BEFORE UPDATE ON "Order"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
