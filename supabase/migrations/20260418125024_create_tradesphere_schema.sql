
/*
  # TradeSphere Full Schema

  ## Tables Created
  - `User` - User accounts with email, hashed password, and virtual balance (default ₹1,00,000)
  - `Portfolio` - User stock holdings with quantity and average buy price
  - `Transaction` - Full trade history (buy/sell) with order and product type
  - `Order` - Advanced order records supporting Market, Limit, SL, SL-M order types

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Authenticated-only access enforced on all policies

  ## Notes
  - All IDs use gen_random_uuid() for security
  - Timestamps use TIMESTAMP(3) for Prisma compatibility
  - updatedAt columns are auto-updated via triggers
  - Indexes added for common query patterns
*/

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  password TEXT,
  balance DOUBLE PRECISION NOT NULL DEFAULT 100000,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"(email);

-- Create Portfolio table
CREATE TABLE IF NOT EXISTS "Portfolio" (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "stockSymbol" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "avgPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Portfolio_pkey" PRIMARY KEY (id),
  CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Portfolio_userId_idx" ON "Portfolio"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Portfolio_userId_stockSymbol_key" ON "Portfolio"("userId", "stockSymbol");

-- Create Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "stockSymbol" TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  "productType" TEXT NOT NULL DEFAULT 'MIS',
  "orderType" TEXT NOT NULL DEFAULT 'MARKET',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY (id),
  CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- Create Order table
CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
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
  "executedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY (id),
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"(status);
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");

-- Auto-update updatedAt trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updatedAt
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

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User table
CREATE POLICY "Users can view own account"
  ON "User" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own account"
  ON "User" FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can insert own account"
  ON "User" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- RLS Policies for Portfolio table
CREATE POLICY "Users can view own portfolio"
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

-- RLS Policies for Transaction table
CREATE POLICY "Users can view own transactions"
  ON "Transaction" FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own transactions"
  ON "Transaction" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

-- RLS Policies for Order table
CREATE POLICY "Users can view own orders"
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
