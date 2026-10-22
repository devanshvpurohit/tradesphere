'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CandlestickChart,
  Briefcase,
  Layers,
  History,
  TrendingUp,
  X,
  Zap,
  Target,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenTradingModal?: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpenTradingModal }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/stocks') {
      return pathname.startsWith('/stocks');
    }
    if (path === '/agents' || path === '/agent-playground') {
      return pathname === '/agents' || pathname === '/agent-playground';
    }
    return pathname === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/stocks', label: 'Market Explorer', icon: CandlestickChart },
    { path: '/agents', label: 'AI Quant Agent Studio', icon: Bot },
    { path: '/options', label: 'Options Desk (F&O)', icon: Target },
    { path: '/portfolio', label: 'Holdings / Portfolio', icon: Briefcase },
    { path: '/orders', label: 'Orders & Positions', icon: Layers },
    { path: '/transactions', label: 'Trade History', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0a0e17] border-r border-slate-800/80 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0e17] rounded-[7px] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center">
                Trade<span className="text-blue-500">Sphere</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block -mt-1">
                Institutional
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Terminal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-400" />
                )}
              </Link>
            );
          })}

          {/* Quick Trade CTA in Sidebar */}
          <div className="pt-6 px-1">
            <Link
              href="/stocks"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Explore & Trade</span>
            </Link>
          </div>
        </div>

        {/* Bottom Account Metric Info */}
        <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-900/40 border">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-slate-400">Order Latency</span>
            <span className="text-emerald-400 font-mono font-semibold">12ms (Ultra-Low)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-slate-400">Intraday Leverage</span>
            <span className="text-blue-400 font-mono font-semibold">Up to 5x MIS</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full w-[85%] rounded-full" />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
            <span>Core Engines</span>
            <span className="text-slate-400">Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
