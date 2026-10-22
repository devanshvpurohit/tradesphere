'use client';

import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Globe2,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 relative overflow-hidden">
      {/* Ambient Radial Lights */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-blue-600/25 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[65%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#070b12]/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0e17] rounded-[7px] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Trade<span className="text-blue-500">Sphere</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <Link href="/stocks" className="hover:text-white transition-colors">
              Market Explorer
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Trading Terminal
            </Link>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              NSE / BSE Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center gap-1.5 active:scale-95"
            >
              <span>Get ₹1,00,000 Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-8 shadow-inner">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Next-Gen Institutional Trading Terminal</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Multi-LLM AI Agent Studio • F&O Options Desk • Firebase Cloud Synced</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Master the Stock Market with{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            ₹1,00,000 Virtual Capital.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Practice professional trading with real-time Indian (NSE/BSE) and US market prices.
          Execute Market, Limit, and Stop-Loss orders with zero financial risk.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Start Paper Trading</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/auth/signin"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Instant Demo Account</span>
          </Link>

          <Link
            href="/stocks"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-transparent hover:bg-slate-900/60 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
          >
            Explore Market Quotes →
          </Link>
        </div>

        {/* Live Terminal Preview Frame */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="p-2 sm:p-3 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="bg-[#0b101c] rounded-2xl p-4 sm:p-6 border border-slate-800/80 text-left">
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">TradeSphere Terminal • RELIANCE.NS [NSE]</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>₹2,982.40 (+1.15%)</span>
                </div>
              </div>

              {/* Terminal Grid Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Virtual Available Margin</span>
                      <span className="text-2xl font-black font-mono text-emerald-400">₹1,00,000.00</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Intraday Leverage</span>
                      <span className="text-sm font-bold font-mono text-blue-400">Up to 5x MIS</span>
                    </div>
                  </div>

                  <div className="h-44 rounded-xl bg-slate-950/70 border border-slate-800 p-4 flex flex-col justify-between">
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>Live Candlestick Engine</span>
                      <span className="text-emerald-400 font-semibold">1D • 15m Candles</span>
                    </div>
                    {/* Simulated Candlesticks */}
                    <div className="flex items-end justify-between h-24 px-4 gap-2">
                      {[40, 55, 35, 65, 80, 60, 75, 95, 70, 85, 100, 92].map((height, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            style={{ height: `${height}%` }}
                            className={`w-full max-w-[12px] rounded-sm ${
                              i % 3 === 0 ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>09:15</span>
                      <span>11:30</span>
                      <span>13:45</span>
                      <span>15:30</span>
                    </div>
                  </div>
                </div>

                {/* Right Mini Order Window */}
                <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between text-xs font-mono">
                  <div>
                    <div className="flex justify-between pb-2 mb-3 border-b border-slate-800">
                      <span className="font-bold text-white">Quick Buy Window</span>
                      <span className="text-blue-400 font-bold">MIS 5x</span>
                    </div>
                    <div className="space-y-2.5 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Qty:</span>
                        <span className="text-white font-bold">50 shares</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price:</span>
                        <span className="text-white font-bold">₹2,982.40</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target (+5%):</span>
                        <span className="text-emerald-400 font-bold">₹3,131.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stop Loss (-2%):</span>
                        <span className="text-rose-400 font-bold">₹2,922.75</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="w-full py-2 bg-blue-600 rounded-lg text-white font-bold text-center">
                      EXECUTE BUY ORDER
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-2">
            Institutional Features
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Built for Traders Who Want Professional Experience
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">₹1,00,000 Virtual Capital</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every account is preloaded with ₹1,00,000 paper trading cash. Reset your balance anytime with one click to test new strategies.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Zerodha Kite Style Orders</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience Market, Limit, and Stop-Loss orders with MIS (Intraday with 5x margin) and CNC (Delivery) product types and GTT target brackets.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">AI Agent Playground</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Build, compile, and backtest your own AI trading bots in JavaScript or connect external LangChain/Python agents via programmatic REST APIs.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Firebase Cloud Backend</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Powered by Google Firebase Authentication and Cloud Firestore for atomic transaction execution, real-time sync, and rock-solid persistence.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TradeSphere</span>
            <span>— Virtual Indian Stock Market Simulator</span>
          </div>
          <div>
            Built with Next.js, Firebase Auth & Firestore, Tailwind CSS, and Lightweight Charts.
          </div>
        </div>
      </footer>
    </div>
  );
}
