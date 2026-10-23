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
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
} from 'lucide-react';
import { useRealtimeTrading } from '@/hooks/useRealtimeTrading';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';

interface Transaction {
  id: string;
  stockSymbol: string;
  type: 'BUY' | 'SELL' | 'SHORT' | 'COVER' | string;
  quantity: number;
  price: number;
  productType: string;
  orderType: string;
  realizedPnL?: number | null;
  executedBy?: string | null;
  reason?: string | null;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Firestore Real-Time Stream Hook
  const { liveTrades, userOrders, seedSampleData, isConnected } = useRealtimeTrading();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (liveTrades.length > 0 || userOrders.length > 0) {
      setLoading(false);
    }
  }, [liveTrades.length, userOrders.length]);

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

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedSampleData();
      soundManager.playOrderSuccess();
      toast.success('Live Demo Transactions & P&L generated in Cloud Firestore!');
      await fetchTransactions();
    } catch (err: any) {
      toast.error('Could not write to Firestore. Please check Firestore security rules.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Merge server transactions or live Firestore stream
  const effectiveTransactions: Transaction[] =
    transactions.length > 0
      ? transactions
      : (liveTrades.length > 0 ? liveTrades : userOrders.filter(o => o.status === 'FILLED' || o.status === 'EXECUTED')).map((t) => ({
          id: t.orderId || `txn_${Math.random().toString(36).substring(2, 7)}`,
          stockSymbol: t.symbol,
          type: t.side,
          quantity: t.quantity,
          price: t.price,
          productType: t.productType || 'MIS',
          orderType: 'MARKET',
          realizedPnL: t.realizedPnL,
          executedBy: t.executedBy,
          reason: t.reason,
          createdAt: t.timestamp,
        }));

  const filtered = effectiveTransactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const totalTurnover = effectiveTransactions.reduce((acc, t) => acc + t.price * t.quantity, 0);

  // Calculate Realized Profits & Realized Losses
  const totalRealizedPnL = effectiveTransactions.reduce((acc, t) => acc + (t.realizedPnL || 0), 0);
  const totalProfits = effectiveTransactions.filter(t => (t.realizedPnL || 0) > 0).reduce((acc, t) => acc + (t.realizedPnL || 0), 0);
  const totalLosses = effectiveTransactions.filter(t => (t.realizedPnL || 0) < 0).reduce((acc, t) => acc + Math.abs(t.realizedPnL || 0), 0);

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
              <span className="text-xs text-amber-400 flex items-center gap-1 font-mono">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Firestore Live (0ms sync)
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Trade Ledger & P&L Audit</h1>
            <p className="text-sm text-slate-400 mt-1">
              Historical ledger of executed transactions, turnover amounts, and realized losses/profits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-2"
              title="Populate sample transaction records with profits & losses"
            >
              <Flame className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Writing to Firestore...' : '⚡ Populate Demo Trades'}</span>
            </button>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Turnover</span>
              <span className="text-sm font-bold text-white">
                ₹{totalTurnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Realized Net P&L</span>
              <span className={`text-sm font-bold ${totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalRealizedPnL >= 0 ? '+' : ''}₹{totalRealizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards: Turnover, Profits, Losses */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 font-mono">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Gross Volume</span>
              <span className="text-lg font-bold text-white mt-0.5 block">
                ₹{totalTurnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-xs text-slate-500">{effectiveTransactions.length} trades</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-emerald-400 font-bold block">Gross Realized Profit</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                +₹{totalProfits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-rose-400 font-bold block">Gross Realized Loss</span>
              <span className="text-lg font-bold text-rose-400 mt-0.5 block">
                -₹{totalLosses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
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
              {f === 'ALL' ? `All Executions (${effectiveTransactions.length})` : `${f} Only`}
            </button>
          ))}
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          {loading && effectiveTransactions.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading transaction history from Cloud Firestore...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Transactions Recorded Yet</h3>
              <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                No transaction records found. Click below to load demo trade tickets with profits and losses, or execute orders on the terminal.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  <Flame className="w-4 h-4" />
                  <span>⚡ Populate Demo Trades & Losses</span>
                </button>
                <Link
                  href="/stocks"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>Go to Market Explorer</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Date & Time</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Instrument</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Execution Price</th>
                    <th className="pb-3 text-right">Turnover (₹)</th>
                    <th className="pb-3 text-right pr-2">Realized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filtered.map((t) => {
                    const isBuy = t.type === 'BUY';
                    const isShort = t.type === 'SHORT';
                    const amount = t.price * t.quantity;
                    const dateFormatted = t.createdAt
                      ? new Date(t.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Just now';

                    const pnl = t.realizedPnL;
                    const hasPnL = pnl !== undefined && pnl !== null;
                    const isProfit = hasPnL && pnl > 0;
                    const isLoss = hasPnL && pnl < 0;

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pl-2 text-slate-400 text-[11px]">{dateFormatted}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : isShort
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-white">
                          <Link
                            href={`/stocks/${t.stockSymbol}`}
                            className="hover:text-blue-400 transition-colors"
                          >
                            {t.stockSymbol}
                          </Link>
                          {t.executedBy && t.executedBy.includes('AI') && (
                            <div className="mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans font-medium inline-flex items-center gap-1">
                                <Bot className="w-2.5 h-2.5 text-purple-400" />
                                {t.executedBy}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-400">{t.productType}</td>
                        <td className="py-3.5 text-right font-bold text-white">{t.quantity}</td>
                        <td className="py-3.5 text-right text-slate-300">₹{t.price.toFixed(2)}</td>
                        <td className="py-3.5 text-right font-bold text-slate-200">
                          ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          {hasPnL ? (
                            <span
                              className={`font-bold inline-flex items-center gap-1 ${
                                isProfit
                                  ? 'text-emerald-400'
                                  : isLoss
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
                              {isLoss && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  LOSS
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
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
