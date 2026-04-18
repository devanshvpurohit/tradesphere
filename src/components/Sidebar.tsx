'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/stocks', label: 'Market', icon: 'trending_up' },
    { path: '/portfolio', label: 'Portfolio', icon: 'account_balance_wallet' },
    { path: '/orders', label: 'Orders', icon: 'receipt' },
    { path: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 z-10">
      <div className="p-6">
        <Link href="/dashboard" className="text-xl font-black tracking-tighter text-black">
          TradeSphere
        </Link>
      </div>
      
      <nav className="px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-700'
                : 'text-black hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
