'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  Menu,
} from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
}

const TICKER_DATA: TickerItem[] = [
  { symbol: 'NIFTY 50', price: '24,852.15', change: '+0.64%', isPositive: true },
  { symbol: 'SENSEX', price: '81,467.20', change: '+0.58%', isPositive: true },
  { symbol: 'BANK NIFTY', price: '51,215.80', change: '+0.78%', isPositive: true },
  { symbol: 'RELIANCE', price: '₹2,982.40', change: '+1.15%', isPositive: true },
  { symbol: 'TCS', price: '₹3,845.00', change: '-0.35%', isPositive: false },
  { symbol: 'HDFCBANK', price: '₹1,678.50', change: '+0.42%', isPositive: true },
  { symbol: 'INFY', price: '₹1,824.10', change: '+1.62%', isPositive: true },
  { symbol: 'NVDA', price: '$138.25', change: '+2.41%', isPositive: true },
  { symbol: 'AAPL', price: '$232.50', change: '+0.89%', isPositive: true },
  { symbol: 'TSLA', price: '$218.60', change: '-1.12%', isPositive: false },
];

export default function TopNav({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const { data: session, signOut } = useSession();
  const [timeStr, setTimeStr] = useState<string>('');
  const [balance, setBalance] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const d = await res.json();
        setBalance(d.balance ?? 100000);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (session) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 12000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleResetFunds = async () => {
    if (!confirm('Reset your account balance to ₹1,00,000 virtual capital and clear all active holdings?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/trade/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        window.location.reload();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-30 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Live Market Marquee Ticker */}
      <div className="bg-[#070b13] border-b border-slate-800/60 overflow-hidden py-1 px-4 text-xs font-mono">
        <div className="flex animate-ticker whitespace-nowrap gap-8">
          {[...TICKER_DATA, ...TICKER_DATA].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">{item.symbol}</span>
              <span className="text-slate-100">{item.price}</span>
              <span
                className={`flex items-center text-[11px] font-bold ${
                  item.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {item.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        {/* Left Side: Mobile Menu Button & Market Status */}
        <div className="flex items-center gap-4">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
              NSE / BSE LIVE
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] font-mono text-slate-400">
              IST {timeStr || '09:15:00'}
            </span>
          </div>
        </div>

        {/* Right Side: Virtual Funds & Account Info */}
        <div className="flex items-center gap-3 md:gap-5">
          {session ? (
            <>
              {/* Virtual Capital Chip */}
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Virtual Balance
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    ₹{balance !== null ? balance.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '1,00,000.00'}
                  </div>
                </div>
                <button
                  onClick={handleResetFunds}
                  disabled={isResetting}
                  title="Reset funds to ₹1,00,000"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-blue-600/30 rounded-lg transition-all"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* User badge */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
                    {session.user.displayName || session.user.email}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-blue-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{session.user.isDemo ? 'Demo Trader' : 'Institutional'}</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800">
                  {session.user.displayName
                    ? session.user.displayName.charAt(0).toUpperCase()
                    : session.user.email
                    ? session.user.email.charAt(0).toUpperCase()
                    : 'U'}
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
