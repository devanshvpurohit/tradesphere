# 🚀 Supabase Quick Start - TradeSphere

## Step 1: Find Your Project URL

1. Go to https://supabase.com/dashboard
2. Select your project
3. Your URL is at the top: `https://xxxxx.supabase.co`
4. Copy this URL

## Step 2: Create Database Tables (Choose ONE method)

### 🎯 Method 1: Supabase SQL Editor (EASIEST - 2 minutes)

1. **Open SQL Editor:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in left sidebar
   - Click **New Query**

2. **Copy & Paste SQL:**
   - Open the file: `scripts/schema.sql`
   - Copy ALL the SQL code
   - Paste into Supabase SQL Editor
   - Click **Run** button (or press Cmd/Ctrl + Enter)

3. **Verify:**
   - Click **Table Editor** in left sidebar
   - You should see 3 tables: `User`, `Portfolio`, `Transaction`

✅ **Done!** Skip to Step 3.

---

### 🔧 Method 2: Using Prisma (If you prefer CLI)

1. **Get Connection String:**
   - Supabase Dashboard → Settings → Database
   - Under "Connection string" → Click **Connection pooling**
   - Copy the URI (looks like: `postgresql://postgres.xxxxx:...`)

2. **Update .env:**
   ```env
   DATABASE_URL="your_connection_string_here?pgbouncer=true"
   DIRECT_URL="your_connection_string_here" # Change port 6543 to 5432
   ```

3. **Run Prisma:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

### 💻 Method 3: Using psql CLI (Advanced)

```bash
# Get connection string from Supabase Dashboard
psql "postgresql://postgres.xxxxx:password@..." -f scripts/schema.sql
```

---

## Step 3: Update Environment Variables

Update your `.env` file:

```env
# Get this from: Supabase Dashboard > Settings > Database > Connection pooling
DATABASE_URL="postgresql://postgres.xxxxx:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Same as above but change port 6543 to 5432
DIRECT_URL="postgresql://postgres.xxxxx:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"

# Your anon key (from Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."

# Service role key (from Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# NextAuth
NEXTAUTH_SECRET="neostock-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Finnhub API
FINNHUB_API_KEY="d7hjqjhr01qhiu0bssb0d7hjqjhr01qhiu0bssbg"
```

## Step 4: Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev
```

Visit: http://localhost:3000

## Step 5: Verify Everything Works

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create an account
4. Check Supabase Dashboard → Table Editor → User table
5. You should see your new user!

---

## 🔍 Where to Find Things in Supabase Dashboard

| What You Need | Where to Find It |
|---------------|------------------|
| **Project URL** | Top of dashboard: `https://xxxxx.supabase.co` |
| **Connection String** | Settings → Database → Connection string |
| **API Keys** | Settings → API → Project API keys |
| **SQL Editor** | Left sidebar → SQL Editor |
| **View Tables** | Left sidebar → Table Editor |
| **Database Password** | Settings → Database → Reset database password |

---

## 🆘 Troubleshooting

### "Connection refused" or "timeout"
- Go to Settings → Database
- Scroll to "Connection pooling"
- Enable "Allow all IP addresses" (or add your IP)

### "Password authentication failed"
- Reset your database password: Settings → Database → Reset database password
- Update the password in your connection string

### "Tables not found"
- Make sure you ran the SQL in Step 2
- Check Table Editor to verify tables exist

### "Prisma Client not generated"
```bash
npx prisma generate
```

---

## 📚 Helpful Commands

```bash
# View database in browser
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset

# Check database connection
npx prisma db pull

# Generate Prisma Client
npx prisma generate
```

---

## 🎉 You're All Set!

Your TradeSphere app is now connected to Supabase and ready to use!

**Next Steps:**
- Deploy to Vercel: `vercel`
- Add more features
- Customize the UI
- Add Indian stocks support

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Check DEPLOYMENT.md for Vercel deployment
