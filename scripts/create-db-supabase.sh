#!/bin/bash

# TradeSphere - Supabase Database Setup Script
# This script helps you set up the database using Supabase SQL Editor

echo "🚀 TradeSphere - Supabase Database Setup"
echo "========================================="
echo ""

# Check if SUPABASE_URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set"
    echo ""
    echo "Please provide your Supabase project URL:"
    echo "Example: https://xxxxx.supabase.co"
    read -p "Supabase URL: " SUPABASE_URL
    
    if [ -z "$SUPABASE_URL" ]; then
        echo "❌ Error: Supabase URL is required"
        exit 1
    fi
else
    SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
fi

# Extract project ref
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

echo ""
echo "📍 Project Reference: $PROJECT_REF"
echo ""
echo "✅ SQL schema file created at: scripts/schema.sql"
echo ""
echo "📋 Next Steps:"
echo ""
echo "Method 1: Supabase Dashboard (Recommended - Easiest)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo "2. Click 'SQL Editor' in the left sidebar"
echo "3. Click 'New Query'"
echo "4. Copy the contents of: scripts/schema.sql"
echo "5. Paste into the SQL editor"
echo "6. Click 'Run' button"
echo "7. Verify tables were created in 'Table Editor'"
echo ""
echo "Method 2: Using psql CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Get your connection string from Supabase Dashboard"
echo "2. Run: psql 'YOUR_CONNECTION_STRING' -f scripts/schema.sql"
echo ""
echo "Method 3: Using Prisma (After getting connection string)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Update DATABASE_URL in .env with your Supabase connection string"
echo "2. Run: npx prisma db push"
echo ""
echo "📖 For detailed instructions, see: SUPABASE_SETUP.md"
echo ""

# Open SQL file in default editor
if command -v code &> /dev/null; then
    echo "📝 Opening schema.sql in VS Code..."
    code scripts/schema.sql
elif command -v nano &> /dev/null; then
    echo "📝 Press Enter to view schema.sql in nano..."
    read
    nano scripts/schema.sql
else
    echo "📄 View the SQL file at: scripts/schema.sql"
fi

echo ""
echo "🌐 Opening Supabase SQL Editor in browser..."
sleep 2

# Try to open browser
if command -v open &> /dev/null; then
    open "https://supabase.com/dashboard/project/$PROJECT_REF/editor"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://supabase.com/dashboard/project/$PROJECT_REF/editor"
else
    echo "Please open: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
fi

echo ""
echo "✨ After running the SQL, update your .env file with:"
echo "DATABASE_URL='postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true'"
echo ""
