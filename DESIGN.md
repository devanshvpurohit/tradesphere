---
name: TradeSphere Institutional Broker & AI Trading Terminal
colors:
  surface: '#070b12'
  surface-dim: '#070b12'
  surface-bright: '#1e293b'
  surface-container-lowest: '#030712'
  surface-container-low: '#0a0f1d'
  surface-container: '#0f172a'
  surface-container-high: '#131e33'
  surface-container-highest: '#1a2742'
  on-surface: '#f1f5f9'
  on-surface-variant: '#94a3b8'
  inverse-surface: '#f1f5f9'
  inverse-on-surface: '#0f172a'
  outline: '#334155'
  outline-variant: '#1e293b'
  surface-tint: '#3b82f6'
  primary: '#3b82f6'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#dbeafe'
  inverse-primary: '#60a5fa'
  secondary: '#10b981'
  on-secondary: '#ffffff'
  secondary-container: '#065f46'
  on-secondary-container: '#a7f3d0'
  tertiary: '#f59e0b'
  on-tertiary: '#000000'
  tertiary-container: '#78350f'
  on-tertiary-container: '#fde68a'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#7f1d1d'
  on-error-container: '#fee2e2'
  primary-fixed: '#dbeafe'
  primary-fixed-dim: '#bfdbfe'
  on-primary-fixed: '#1e3a8a'
  on-primary-fixed-variant: '#1d4ed8'
  secondary-fixed: '#d1fae5'
  secondary-fixed-dim: '#a7f3d0'
  on-secondary-fixed: '#064e3b'
  on-secondary-fixed-variant: '#047857'
  tertiary-fixed: '#fef3c7'
  tertiary-fixed-dim: '#fde68a'
  on-tertiary-fixed: '#78350f'
  on-tertiary-fixed-variant: '#b45309'
  background: '#070b12'
  on-background: '#f1f5f9'
  surface-variant: '#1a2742'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '48px'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '36px'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '28px'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '24px'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '24px'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '20px'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '16px'
  label-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '22px'
    letterSpacing: 0.02em
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '18px'
    letterSpacing: 0.02em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '14px'
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container_max_width: 1720px
  gutter: 16px
---

# TradeSphere: Institutional UI/UX Design System Specification

## Brand & Visual Philosophy

TradeSphere bridges the razor-sharp execution speed of **Zerodha Kite**, the deep technical charting of **TradingView**, and the multi-agent cognitive intelligence of modern **Autonomous AI Hedge Funds**.

The visual language is characterized by **Nocturnal Precision**:
- **Zero Cognitive Fatigue**: High-contrast, dark-mode-first terminal engineered for 12+ hour trading sessions without eye strain.
- **Microsecond Optical Parsing**: Financial numerals, bid/ask depth spread, Greeks (Delta, Gamma, Vega, Theta), and order status badges use strict tabular monospace alignment.
- **Glass-Tier Hierarchy**: Layered obsidian cards with ultra-thin 1px borders (`#1e293b`) and subtle glow highlights that draw immediate attention to critical trading states (fill execution, broker risk alert, margin call).

---

## Color Architecture & Semantics

The palette uses dark obsidian canvas tones contrasted with high-saturation functional accents:

### 1. Canvas & Structural Planes
- **Root Background Canvas (`#070B12`)**: Deepest void blue, eliminating glare and framing high-frequency candlestick charts.
- **Surface Elevation 1 (`#0A0F1D`)**: Sidebar navigation, watchlists, and persistent system HUDs.
- **Surface Elevation 2 (`#0F172A`)**: Primary container cards, order forms, and technical metrics panels.
- **Surface Elevation 3 (`#131E33` / `#1A2742`)**: Hover states, active tabs, modal dialogs, and table header rows.
- **Structural Outlines (`#1E293B` / `#334155`)**: Sub-pixel 1px dividers establishing clear boundary definition without visual clutter.

### 2. Functional & Market States
- **Bullish / Buy / Executed (`#10B981` Emerald)**:
  - Fill orders, positive P&L gains, ask volume dominance, call option ITM highlighting.
  - Background tint: `rgba(16, 185, 129, 0.12)` with `border-emerald-500/30`.
- **Bearish / Sell / Risk Breached (`#EF4444` Rose Red)**:
  - Short orders, stop-loss trigger warnings, unrealized losses, put option dominance.
  - Background tint: `rgba(239, 68, 68, 0.12)` with `border-red-500/30`.
- **System Accent & Telemetry (`#3B82F6` Electric Blue)**:
  - Active broker mode, primary CTA buttons, SMA/EMA moving average indicators, websocket streaming pulses.
  - Container accent: `rgba(59, 130, 246, 0.15)` with `border-blue-500/40`.
- **Warning & Neutral (`#F59E0B` Amber)**:
  - Pending limit orders, margin utilization >75%, volatility skew cautions, Ollama local model warm-up notices.

---

## Typography & Tabular Numerals

The typography pairing uses **Inter** for structural headers and descriptive prose, paired with **JetBrains Mono** for all market data readouts.

```
+-------------------------------------------------------------------------+
| DISPLAY HEADLINES   | Inter Bold / SemiBold (Tracking -0.02em)         |
| SECTION LABELS      | Inter Medium (Uppercase, tracking 0.05em, 11px)   |
| PRICES & GREEKS     | JetBrains Mono SemiBold (tnum font-variant)      |
| ORDER BOOK DEPTH    | JetBrains Mono Medium (Strict character width)    |
+-------------------------------------------------------------------------+
```

### Typographic Scale
- `display-xl`: 40px / 48px — Hero portfolio valuation ($124,590.50).
- `headline-lg`: 28px / 36px — Symbol active price banner & primary dashboard views.
- `headline-md`: 20px / 28px — Card headers, module titles (Options Chain, Broker Audit).
- `headline-sm`: 16px / 24px — Modal titles, dropdown triggers, and sub-headings.
- `body-md`: 14px / 20px — Standard body text, form labels, parameter descriptions.
- `body-sm`: 12px / 16px — Secondary metadata, timestamps, exchange tags (NSE, NASDAQ).
- `label-mono-md`: 13px / 18px — Real-time LTP, IV %, Delta/Gamma readouts, order quantities.
- `label-mono-sm`: 11px / 14px — Order IDs, Firebase sync ping (42ms), contract lot sizes.

---

## Layout Architecture & Density System

TradeSphere employs an institutional **Compact Density Grid** designed to fit critical trading information into viewport without requiring endless scrolling.

```
+---------------------------------------------------------------------------------------+
| [TradeSphere]  [Terminal] [Options Desk] [AI Playground] [Portfolio]   | $100,000  RTDB ● |
+-----------------------+-----------------------------------------------+---------------+
| WATCHLIST (280px)     | CANDLESTICK CHART & TECHNICALS (Flex-1)       | ORDER PAD     |
| • NIFTY 50  24,850 ▲  | [1m] [5m] [15m] [1D] | [Indicators: RSI/MACD] | [BUY]  [SELL] |
| • BANKNIFTY 52,100 ▼  | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  | MIS | NRML    |
| • RELIANCE  3,040  ▲  | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  | Qty: [ 50   ] |
| • TCS       4,120  ▲  | Volume Profile Sub-pane                      | Price: MKT    |
+-----------------------+-----------------------------------------------+ Trigger: GTT  |
| LEVEL 2 DEPTH (280px) | BROKER AUDIT TICKET & AGENT STREAM (Height:240)| Margin: $2,450|
| Bid Qty | Bid | Ask | | [DEEPSEEK R1] Signal: STRONG BUY (RSI: 28.4)  | [EXECUTE BUY] |
| 1,200   | 102 | 103 | | Action: Executed 50 Qty @ $102.50 | SL: $98.00|               |
+-----------------------+-----------------------------------------------+---------------+
```

### Grid Parameters
- **Container Max Width**: `1720px` (ultra-wide desktop friendly, fluid scaling down to tablet).
- **Multi-Panel Ratio**: Left Watchlist/Depth (300px) | Center Chart & Workspace (Flex-1) | Right Execution Dock (340px).
- **Base Grid Unit**: 4px baseline. Spacing tokens strictly adhere to 4, 8, 12, 16, 24, 32, 48px.

---

## Elevation, Depth & Glassmorphism

1. **Base Layer (`Level 0`)**: Canvas `#070B12`.
2. **Component Panels (`Level 1`)**: `#0F172A` with `1px solid #1E293B` and `rounded-lg` (8px).
3. **Interactive Floating Elements (`Level 2`)**: Modals, Broker Audit tickets, and Gmail Contract Note dialogs use `backdrop-filter: blur(16px)` with `background: rgba(15, 23, 42, 0.88)` and subtle top specular highlight (`border-t: 1px solid rgba(255,255,255,0.08)`).
4. **Active Glows**:
   - Buy Action: `box-shadow: 0 0 20px -5px rgba(16, 185, 129, 0.25)`
   - Sell Action: `box-shadow: 0 0 20px -5px rgba(239, 68, 68, 0.25)`
   - AI Autonomous Pulse: `box-shadow: 0 0 25px -4px rgba(59, 130, 246, 0.3)`

---

## Specialized Component Blueprints

### 1. Level 2 Market Depth (5-Depth Bid/Ask Ladder)
- **Bid Column (Left)**: Emerald text `#10B981` with horizontal volume bar fill (`rgba(16, 185, 129, 0.15)` width proportional to total bid volume).
- **Ask Column (Right)**: Rose text `#EF4444` with horizontal volume bar fill (`rgba(239, 68, 68, 0.15)` width proportional to total ask volume).
- **Spread Bar (Center)**: Dynamic micro-badge showing live spread (e.g. `Spread: $0.05 (0.02%)`).

### 2. Autonomous Broker Cockpit & Execution Engine
- **Model Selector Pills**: Quick-switch buttons for `Ollama (Local Llama 3 / Mistral / Qwen)`, `DeepSeek R1 / V3`, `GPT-4o`, `Claude 3.5 Sonnet`, and `Gemini 1.5 Pro`.
- **System Prompt & Decision Rules Editor**: Code-styled textarea with syntax tinting, pre-loaded with institutional trend-following and mean-reversion rule templates.
- **Autonomous Broker Switch**: Toggle with glowing pulse indicator (`ACTIVE BROKERING` vs `SIMULATION / ADVISORY`).
- **Live Broker Audit Ticket**:
  - Timestamp, evaluated signal (BUY/SELL/HOLD), RSI/EMA technical confluence, order size calculation, stop-loss bracket, and execution transaction ID.

### 3. Institutional Options Chain Desk
- **Dual-Side Matrix**: Calls on left, Strike in center spine, Puts on right.
- **Moneyness Tinting**:
  - ITM Calls: Shaded light emerald background (`rgba(16, 185, 129, 0.05)`).
  - ITM Puts: Shaded light rose background (`rgba(239, 68, 68, 0.05)`).
  - ATM Strike: High-contrast blue highlight with target strike crosshair.
- **Greeks Telemetry Columns**: IV (Implied Volatility), $\Delta$ (Delta), $\Gamma$ (Gamma), $\Theta$ (Theta Decay / Day), $\nu$ (Vega), Open Interest (OI) with horizontal progress bars.

### 4. Zerodha-Compliant Digital Contract Note & Gmail Modal
- **Digital Header**: Contract Note No., Settlement Date, Broker SEBI/FinTech Reg info, User Client ID.
- **Financial Ledger Table**:
  - Trade Time, Order Ref, Instrument, Buy/Sell, Qty, Gross Rate, Brokerage ($0.00 zero-commission demo), STT/CTT, Exchange Turnover Fee, Net Total Receivable/Payable.
- **Dispatch Action**: One-click **"Send Contract Note to Gmail"** with instant verification status and real-time RTDB ledger sync.

### 5. Firebase Realtime Database Status HUD
- **Persistent Live Pill**: Displays `● RTDB Connected` with live millisecond ping (`<45ms`) and pulse animation.
- **Instant Synchronization**: Cash balance, open positions, order executions, and AI agent signal history update in real-time across multiple client tabs without page reload.

---

## Stitch MCP Integration Instructions

To upload and apply this design system to a Stitch project:

1. **Encode to Base64**:
   ```bash
   base64 -i DESIGN.md -o design_md_b64.txt
   ```
2. **Call `upload_design_md`**:
   Pass the `projectId` and `designMdBase64` string.
3. **Call `create_design_system_from_design_md`**:
   Link the uploaded screen instance to initialize the complete design tokens, typography scales, and component library.
4. **Theme Configuration Summary**:
   - `colorMode`: `DARK`
   - `customColor`: `#3B82F6` (Electric Blue)
   - `headlineFont`: `INTER`
   - `bodyFont`: `INTER`
   - `labelFont`: `JETBRAINS_MONO`
   - `roundness`: `ROUND_EIGHT`
   - `colorVariant`: `FIDELITY`
