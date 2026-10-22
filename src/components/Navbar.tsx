'use client';

import Link from 'next/link';
import { useSession } from '@/components/AuthContext';
import { usePathname } from 'next/navigation';
import { TrendingUp, LayoutDashboard, CandlestickChart, Briefcase, History } from 'lucide-react';

export default function Navbar() {
  const { data: session, signOut } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#0c121e] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-xl font-black text-white">TradeSphere</span>
            </Link>

            {session && (
              <div className="hidden md:flex space-x-2">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive('/dashboard') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/stocks"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive('/stocks') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Market
                </Link>
                <Link
                  href="/portfolio"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive('/portfolio') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portfolio
                </Link>
                <Link
                  href="/orders"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive('/orders') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href="/transactions"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive('/transactions') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transactions
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1.5"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
