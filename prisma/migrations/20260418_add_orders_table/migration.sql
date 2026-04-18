-- Add new columns to Transaction table
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "productType" TEXT NOT NULL DEFAULT 'MIS';
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "orderType" TEXT NOT NULL DEFAULT 'MARKET';

-- Create Order table
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
