-- TradeSphere Database Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    balance DOUBLE PRECISION DEFAULT 100000 NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Portfolio table
CREATE TABLE IF NOT EXISTS "Portfolio" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Portfolio_userId_stockSymbol_key" UNIQUE ("userId", "stockSymbol")
);

-- Create Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Portfolio_userId_idx" ON "Portfolio"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- Create function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updatedAt updates
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_updated_at ON "Portfolio";
CREATE TRIGGER update_portfolio_updated_at BEFORE UPDATE ON "Portfolio"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Portfolio', 'Transaction');
