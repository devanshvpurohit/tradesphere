#!/bin/bash

echo "🚀 TradeSphere - Supabase Setup Script"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your Supabase credentials"
    exit 1
fi

# Check if DATABASE_URL is set
if grep -q "YOUR_PROJECT_REF" .env; then
    echo "⚠️  Warning: Please update .env with your actual Supabase credentials"
    echo ""
    echo "Steps:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > Database"
    echo "4. Copy the Connection Pooling string"
    echo "5. Update DATABASE_URL and DIRECT_URL in .env"
    echo ""
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️  Pushing schema to Supabase..."
npx prisma db push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Visit http://localhost:3000"
echo "3. Create an account and start trading!"
echo ""
echo "Optional: Run 'npx prisma studio' to view your database"
