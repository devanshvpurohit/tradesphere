'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import {
  History,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Zap,
} from 'lucide-react';

interface Transaction {
  id: string;
  stockSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  productType: string;
  orderType: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const totalTurnover = transactions.reduce((acc, t) => acc + t.price * t.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <main className="md:ml-64 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AUDIT TRAIL
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Firebase Firestore Records</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Trade Ledger</h1>
            <p className="text-sm text-slate-400 mt-1">
              Historical ledger of executed transactions, turnover amounts, and product classifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Turnover</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                ₹{totalTurnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === f
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f === 'ALL' ? 'All Executions' : `${f} Only`}
            </button>
          ))}
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading transaction history...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Transactions Recorded</h3>
              <p className="text-xs text-slate-400 mb-5">
                Execute market or limit orders to populate your transaction audit ledger.
              </p>
              <Link
                href="/stocks"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Trade Stocks Now</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Timestamp</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Execution Price</th>
                    <th className="pb-3 text-right">Gross Turnover</th>
                    <th className="pb-3 text-right pr-2">Simulated Brokerage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filtered.map((t) => {
                    const isBuy = t.type === 'BUY';
                    const turnover = t.price * t.quantity;
                    const dateFormatted = new Date(t.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pl-2 text-slate-400 text-[11px]">{dateFormatted}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-white">
                          <Link href={`/stocks/${t.stockSymbol}`} className="hover:text-blue-400 transition-colors">
                            {t.stockSymbol}
                          </Link>
                        </td>
                        <td className="py-3.5 text-slate-400">{t.productType || 'MIS'}</td>
                        <td className="py-3.5 text-right font-bold text-slate-200">{t.quantity}</td>
                        <td className="py-3.5 text-right text-slate-400">₹{t.price.toFixed(2)}</td>
                        <td className="py-3.5 text-right font-bold text-white">
                          ₹{turnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right pr-2 text-emerald-400 font-semibold">
                          ₹0.00 (Zero)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
