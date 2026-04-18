const https = require('https');

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

// You need to provide your Supabase project URL
// Format: https://YOUR_PROJECT_REF.supabase.co
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.error('❌ Error: Please set NEXT_PUBLIC_SUPABASE_URL environment variable');
  console.log('Example: export NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('🚀 Setting up TradeSphere database in Supabase...');
console.log(`📍 Project: ${projectRef}`);
console.log('');

// SQL to create tables
const createTablesSQL = `
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "Portfolio_userId_idx" ON "Portfolio"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolio_updated_at ON "Portfolio";
CREATE TRIGGER update_portfolio_updated_at BEFORE UPDATE ON "Portfolio"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Alternative: Use Supabase SQL Editor endpoint
function executeSQLDirect(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    console.log('⚠️  Note: Direct SQL execution via REST API is limited.');
    console.log('📝 Recommended: Use Supabase Dashboard SQL Editor or connection string with Prisma');
    console.log('');
    
    reject(new Error('Please use one of the recommended methods below'));
  });
}

console.log('📋 Database Schema Ready!');
console.log('');
console.log('⚠️  Supabase REST API does not support direct SQL execution.');
console.log('');
console.log('✅ Please use one of these methods:');
console.log('');
console.log('Method 1: Supabase Dashboard (Easiest)');
console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef + '/editor');
console.log('2. Click "SQL Editor" in the left sidebar');
console.log('3. Click "New Query"');
console.log('4. Copy and paste the SQL from: scripts/schema.sql');
console.log('5. Click "Run"');
console.log('');
console.log('Method 2: Using Prisma (Recommended)');
console.log('1. Get your connection string from Supabase Dashboard > Settings > Database');
console.log('2. Update DATABASE_URL in .env file');
console.log('3. Run: npx prisma db push');
console.log('');
console.log('Method 3: Using psql CLI');
console.log('1. Get connection string from Supabase Dashboard');
console.log('2. Run: psql "YOUR_CONNECTION_STRING" -f scripts/schema.sql');
console.log('');

// Save SQL to file for easy copy-paste
const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, 'schema.sql');
fs.writeFileSync(sqlFilePath, createTablesSQL);

console.log('💾 SQL schema saved to: scripts/schema.sql');
console.log('');
console.log('🎯 Next Steps:');
console.log('1. Choose one of the methods above');
console.log('2. Execute the SQL schema');
console.log('3. Run: npm run dev');
console.log('4. Visit: http://localhost:3000');
