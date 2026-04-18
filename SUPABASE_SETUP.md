# Supabase Database Setup Guide

## Step 1: Get Your Connection String

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** (gear icon) > **Database**
4. Scroll down to **Connection string** section
5. Select **Connection pooling** tab (recommended for serverless)
6. Copy the connection string

### Connection String Format:

**For Connection Pooling (Recommended):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**For Direct Connection (for migrations):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**Important:** Replace `[password]` with your actual database password (not the service role key)

## Step 2: Update .env File

Replace the placeholders in `.env`:

```env
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

## Step 3: Update Prisma Schema

Update `prisma/schema.prisma` to use both URLs:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Step 4: Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

## Step 5: Verify Database

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

Or check in Supabase Dashboard:
1. Go to **Table Editor**
2. You should see: `User`, `Portfolio`, `Transaction` tables

## Troubleshooting

### Error: Connection timeout
- Check if your IP is allowed in Supabase
- Go to **Settings** > **Database** > **Connection pooling**
- Ensure "Allow all IP addresses" is enabled (or add your IP)

### Error: Password authentication failed
- Double-check your database password
- Reset password in Supabase: **Settings** > **Database** > **Reset database password**

### Error: SSL required
- Add `?sslmode=require` to your connection string

## Quick Setup Script

Run this after updating your `.env`:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Start development server
npm run dev
```

## Supabase Features You Can Use

Your service role key enables:
- Direct database access
- Supabase Auth (alternative to NextAuth)
- Supabase Storage (for file uploads)
- Realtime subscriptions
- Row Level Security (RLS)

## Connection String Examples

### Mumbai Region (ap-south-1):
```
postgresql://postgres.abcdefgh:password123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Singapore Region (ap-southeast-1):
```
postgresql://postgres.abcdefgh:password123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Need Help?

1. Check Supabase docs: https://supabase.com/docs/guides/database
2. Prisma + Supabase guide: https://www.prisma.io/docs/guides/database/supabase
3. Check your Supabase project logs in the dashboard

---

**Note:** Keep your database password and service role key secure. Never commit them to Git!
