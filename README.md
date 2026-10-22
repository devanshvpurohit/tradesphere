# 📈 TradeSphere — Institutional Virtual Stock Trading Platform

TradeSphere is a real-time paper trading terminal for Indian (NSE/BSE) and global stock markets. Preloaded with **₹1,00,000 in virtual capital**, TradeSphere empowers traders, investors, and students to master intraday and delivery trading with zero financial risk.

Powered by **Google Firebase (Authentication & Cloud Firestore)** and styled with an elite **Zerodha Kite + TradingView inspired dark terminal UI/UX**.

---

## ✨ Features & Upgrades

### 🎨 Institutional UI/UX
- **Zerodha Kite & TradingView Inspired Terminal**: Dark slate aesthetics with ambient neon indicators, glassmorphic panels, and high-contrast typography.
- **Live Market Ticker Tape**: Real-time scrolling ticker showcasing NIFTY 50, SENSEX, BANK NIFTY, and key equities with live price flash ticks.
- **Interactive Candlestick Charting**: High-performance candlestick and area charts powered by TradingView's Lightweight Charts, with multi-timeframe toggles (`1D`, `1W`, `1M`, `3M`, `1Y`).
- **Live Level 2 Market Depth**: Simulated 5-best bids and 5-best asks with order queue size and volume depth bars.
- **Side Order Desk**: Execute trades without closing the chart view.

### ⚡ Professional Trading Execution
- **Order Types**:
  - `MARKET`: Instant order execution at prevailing LTP.
  - `LIMIT`: Queue orders at preferred entry prices.
  - `SL / SL-M`: Stop-loss protection orders with trigger validation.
- **Product Types**:
  - `MIS`: Intraday trading with up to 5x margin simulation.
  - `NRML / CNC`: Overnight delivery equity holding.
- **GTT Target & Stop-Loss Brackets**: Real-time estimated profit & loss projections in ₹ with Risk-to-Reward ratio calculator (`1 : 2.5`).
- **One-Click Position Management**: Instant "Add More" or "Exit Position" straight from your portfolio table.

### 🔥 Powered by Firebase
- **Firebase Authentication**: Email/Password and Google OAuth sign-in.
- **Instant Demo Mode**: One-click demo trader account preloaded with ₹1,00,000 — test immediately without registration!
- **Cloud Firestore Real-Time Database**: Atomic Firestore transactions (`runTransaction`) for balance deductions and portfolio share calculations, eliminating race conditions.
- **One-Click Capital Reset**: Restart your simulation anytime back to ₹1,00,000.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Backend / Database**: Google Firebase (Authentication & Cloud Firestore)
- **Styling**: Tailwind CSS + Custom Dark Theme
- **Charting**: Lightweight Charts (TradingView)
- **Icons**: Lucide React
- **Market Data**: Finnhub API integration with realistic fallback quote engine

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/devanshvpurohit/tradesphere.git
cd tradesphere
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for full instructions on configuring your Firebase project.)*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── portfolio/       # User holdings & balance API
│   │   ├── stocks/          # Real-time quotes, details & search
│   │   ├── trade/           # Order placement, execution & reset
│   │   └── transactions/    # Historical trade audit ledger
│   ├── auth/
│   │   ├── signin/          # Firebase & Demo sign-in
│   │   └── signup/          # New trader registration
│   ├── dashboard/           # Main terminal overview & metrics
│   ├── orders/              # Active & historical order book
│   ├── portfolio/           # Equity holdings & unrealized returns
│   ├── stocks/              # Market Explorer & Candlestick desk
│   ├── globals.css          # Dark terminal design system
│   └── page.tsx             # High-impact landing page
├── components/
│   ├── AuthContext.tsx      # Firebase auth provider & session state
│   ├── Sidebar.tsx          # Collapsible terminal sidebar
│   ├── TopNav.tsx           # Live ticker tape & capital monitor
│   └── TradingModal.tsx     # Zerodha Kite-style order window
├── lib/
│   └── firebase/
│       ├── config.ts        # Firebase credentials config
│       ├── client.ts        # Client Firebase initialization
│       ├── admin.ts         # Server Firebase Admin SDK
│       ├── db.ts            # Firestore database operations
│       └── auth-helper.ts   # Session & token verification
└── services/
    ├── marketService.ts     # Live market quote & candlestick engine
    └── tradingService.ts    # Portfolio & trade execution logic
```

---

## 🛡️ License
MIT License. TradeSphere is designed for simulation and educational paper trading.
