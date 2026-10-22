# 🏆 TradeSphere — HackOctober MLH X Tech4hack Submission

**Live Devpost Entry**: [HackOctober MLH X Tech4hack](https://hackoctober-mlh-x-tech4hack.devpost.com/)  
**GitHub Repository**: [https://github.com/devanshvpurohit/tradesphere](https://github.com/devanshvpurohit/tradesphere)  
**Track Focus**: AI, Financial Inclusion / Fintech, Open-Source  

---

## 💡 Tagline
**Master Indian (NSE/BSE) equities and derivatives risk-free with ₹1,00,000 virtual capital, real-time AI Co-Pilot signals, and Black-Scholes Options Greeks desk.**

---

## 🎯 Inspiration
Over 80% of retail options and equity traders in emerging markets like India incur losses during their first year due to lack of practical experience, emotional panic, and absence of realistic simulation tools. Existing paper trading platforms are either outdated, full of ads, or lack modern institutional trading capabilities like:
- **Zerodha Kite-style order types** (MIS 5x Intraday, NRML, Limit, Stop Loss).
- **Options Greeks (F&O)** calculations (Delta, Theta, Vega, Gamma).
- **Algorithmic technical indicator integration** (RSI, MACD, EMAs) with an **AI Copilot** that synthesizes price action and flags risk levels.

We built **TradeSphere** to democratize professional, institutional-grade market education with zero financial risk.

---

## ⚡ What TradeSphere Does

1. **Preloaded Virtual Capital**:
   - Every trader gets **₹1,00,000 in virtual trading capital** upon signup or instant demo launch.
   - 1-click **Reset Funds** to start fresh whenever testing new trading strategies.
2. **AI Co-Pilot & Technical Indicators Engine**:
   - Powered by open-source [`technicalindicators`](https://github.com/anandanand84/technicalindicators).
   - Real-time computing of **RSI (14)**, **MACD (12, 26, 9)**, **EMA 20**, and **SMA 50**.
   - Generates an intelligent **Bullish/Bearish Confidence Score (%)**, Key Support/Resistance zones, and risk alerts.
3. **NSE Options Desk & Black-Scholes Greeks (F&O)**:
   - Uses open-source [`black-scholes`](https://github.com/benjamincburns/black-scholes) differential equations.
   - Real-time **NIFTY 50** & **BANK NIFTY** Option Chain with Call/Put LTP, Delta ($\Delta$), Theta ($\theta$), Gamma ($\gamma$), Vega ($\nu$), Put-Call Ratio (PCR), and Max Pain Strike.
4. **Multi-LLM Autonomous AI Agent Studio & Quant Sandbox**:
   - **Build Your Own AI Trading Agents**: Users can create custom autonomous trading agents powered by **Ollama (100% Free & Local)**, **OpenAI (GPT-4o/mini)**, **Anthropic Claude (3.5 Sonnet/Haiku)**, **Google Gemini (1.5 Flash/Pro)**, **Groq (LLaMA 3.3 70B)**, or **OpenRouter**.
   - **Local Ollama Auto-Discovery**: Automatically queries `http://localhost:11434` to discover locally installed models (Gemma, Llama 3.2, Mistral, DeepSeek R1). Allows 100% private, zero-API-key algorithmic decision making directly on user hardware.
   - **Client-Side Key Privacy**: Cloud provider API keys are stored strictly in client-side `localStorage`, never exposed publicly.
   - **Real-Time Agent Market Evaluation**: Agents receive live stock quotes, RSI, MACD, 20 EMA, 50 SMA, Bollinger Bands, and portfolio cash limits to produce structured BUY/SELL/HOLD recommendations, target prices, stop-losses, and risk-reward ratios with 1-click execution into Firestore.
   - **Rule-Based Quant Code IDE & Backtester**: Built-in strategy code editor where users can compile and backtest algorithmic strategies against real-world candle datasets with Sharpe ratio, Win Rate %, and Max Drawdown %.
   - **External Webhooks**: REST endpoints (`POST /api/agents/trade`) for Python, LangChain, AutoGen, and CrewAI swarms.
5. **Zerodha Kite & TradingView Inspired Terminal UI/UX**:
   - High-contrast dark terminal palette with ambient radar status indicators.
   - **Continuous Scrolling Ticker Tape**: Live index ticks for NIFTY 50, SENSEX, BANK NIFTY, and large-cap equities.
   - **Interactive Candlestick Desk**: TradingView Lightweight Charts with `1D`, `1W`, `1M`, `3M`, `1Y` toggles and Candlestick/Area switchers.
   - **Level 2 Market Depth**: 5-best bids and 5-best asks with volume queue visualization.
5. **Instant Demo Mode**:
   - One-click instant paper trading session preloaded with ₹1,00,000 — zero setup required to test immediately.
6. **Micro-Interactions & Sensory Feedback**:
   - Audio feedback synthesizer (order execution chimes like institutional Bloomberg/Zerodha terminals).
   - Confetti bursts on successful trade entries.
   - Modern dark toast notifications powered by `sonner`.

---

## 🛠️ How We Built It

- **Frontend & App Architecture**: [Next.js 14](https://nextjs.org/) App Router, TypeScript, React 18, Tailwind CSS.
- **Backend & Cloud Database**: [Google Firebase](https://firebase.google.com/) (Firebase Auth + Cloud Firestore).
- **Atomic Concurrency**: Implemented Firestore `runTransaction` to atomically debit/credit cash balances, update position quantities, and compute weighted average buy prices without race conditions.
- **Financial Charting**: [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts) v4.
- **Quantitative Libraries**:
  - `technicalindicators`: Algorithmic momentum, crossover, and trend indicator calculation.
  - `black-scholes`: Option Greeks & theoretical premium valuation.
  - `sonner`: Toast alerts.
  - `canvas-confetti`: Sensory reward visualizer.
  - Web Audio API: Zero-dependency terminal sound chimes.

---

## 🚧 Challenges We Ran Into

1. **Atomic Portfolio Recalculation**: In fast-paced paper trading, placing multiple market and limit orders simultaneously could cause race conditions in balance deduction. We solved this by using Firestore atomic transactions (`runTransaction`), ensuring that the user's cash balance and portfolio holdings update in a single ACID commit.
2. **Options Greeks & Expiry Decay**: Computing real-time Delta, Theta, and Gamma for dozens of strikes on sub-second timeframes required mathematical optimization of normal distribution cumulative and probability density functions.
3. **Lightweight Charts SSR & Hydration**: Financial charts require DOM `clientWidth` measurements that fail in Next.js Server Components. We encapsulated canvas rendering in dynamic client hooks with responsive resize listeners and timeframe re-caching.

---

## 🏆 Accomplishments We're Proud Of

- Migrated away completely from Supabase to **100% Firebase** (Auth + Firestore).
- Engineered a complete **Options Chain with Black-Scholes Greeks**, rare in paper trading simulators.
- Designed an **AI Market Copilot** that converts complex technical indicators into plain-English actionable signals and risk zones.
- Built an **Instant Demo Mode** that allows hackathon judges and users to immediately test the platform in 1 click without filling out any signup forms.

---

## 📖 What We Learned

- How institutional brokers construct Level 2 market depth and prioritize Limit vs Market orders.
- Implementing financial option math (Black-Scholes-Merton model) in modern TypeScript.
- Structuring Firebase Cloud Firestore security rules to protect user portfolios and transaction audit trails.

---

## 🚀 What's Next for TradeSphere

- **Live WebSocket Streams**: Connecting directly to Angel One SmartAPI / Zerodha Kite Connect WebSocket feeds for real-time live Indian market ticks.
- **Automated Algorithmic Backtesting**: Allowing users to backtest Python or JS trading strategies against historical NSE Bhavcopy data.
- **Multiplayer Trading Tournaments**: Fantasy-style trading leagues where universities and clubs can host paper trading competitions with real-time leaderboards.
