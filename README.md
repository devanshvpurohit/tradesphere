# TradeSphere - Virtual Stock Trading Simulator

A full-stack virtual stock trading platform built with Next.js, featuring real-time market data, portfolio management, and institutional-grade UI/UX design.

## Features

- 🔐 **Secure Authentication** - NextAuth.js with credentials and OAuth support
- 📊 **Real-time Market Data** - Live stock prices via Finnhub API
- 💼 **Portfolio Management** - Track holdings, P/L, and performance
- 💰 **Virtual Trading** - Buy and sell stocks with ₹1,00,000 starting capital
- 📈 **Interactive Charts** - Price charts using Lightweight Charts
- 🎨 **Premium UI/UX** - Institutional-grade design with Material Symbols
- 🇮🇳 **Indian Market Focus** - NSE/BSE references, IST timezone, ₹ currency


## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Charts**: Lightweight Charts
- **Market Data**: Finnhub API along with yahooo finace 
- **Icons**: Material Symbols Outlined

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Finnhub API key (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tradesphere
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tradesphere"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
FINNHUB_API_KEY="your-finnhub-api-key"
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
tradesphere/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── portfolio/         # Portfolio page
│   │   ├── stocks/            # Stock pages
│   │   └── transactions/      # Transactions page
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   ├── services/              # Business logic services
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
└── public/                    # Static assets
```

## Database Schema

- **User**: User accounts with email, password, and balance
- **Portfolio**: User stock holdings with quantity and average price
- **Transaction**: Trading history (buy/sell transactions)

## API Routes

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `GET /api/portfolio` - Get user portfolio
- `GET /api/stocks` - Get popular stocks
- `GET /api/stocks/search` - Search stocks
- `GET /api/stocks/[symbol]` - Get stock details
- `POST /api/trade/buy` - Buy stocks
- `POST /api/trade/sell` - Sell stocks
- `GET /api/transactions` - Get transaction history

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for Vercel.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tradesphere)

1. Click the button above
2. Set environment variables in Vercel dashboard
3. Deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `FINNHUB_API_KEY` | Finnhub API key | Yes |

## Features Roadmap

- [ ] Real Indian stock support (NSE/BSE)
- [ ] Advanced charting with indicators
- [ ] Watchlist functionality
- [ ] Price alerts
- [ ] Portfolio analytics
- [ ] Social trading features
- [ ] Mobile app (React Native)
- [ ] Paper trading competitions

## Known Limitations

- Currently uses US stocks (AAPL, MSFT, etc.) due to Finnhub free tier limitations
- Indian stocks (.NS suffix) have limited support on Finnhub free tier
- Consider using NSE India API or Alpha Vantage for better Indian stock coverage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Review Finnhub API documentation

## Acknowledgments

- Design inspired by institutional trading platforms
- Market data provided by Finnhub
- Icons by Google Material Symbols
- Charts by TradingView Lightweight Charts

---

Built with ❤️ for the Indian trading community
