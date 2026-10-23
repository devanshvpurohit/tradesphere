'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import {
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Trash2,
  Zap,
  Flame,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { useRealtimeTrading } from '@/hooks/useRealtimeTrading';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sound';

interface Order {
  id: string;
  stockSymbol: string;
  type: 'BUY' | 'SELL' | 'SHORT' | 'COVER' | string;
  orderType: string;
  productType: string;
  quantity: number;
  price?: number | null;
  triggerPrice?: number | null;
  targetPrice?: number | null;
  stopLoss?: number | null;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  executedPrice?: number | null;
  executedAt?: string | null;
  realizedPnL?: number | null;
  executedBy?: string | null;
  reason?: string | null;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Firestore Real-Time Stream Hook
  const { userOrders, isConnected, seedSampleData } = useRealtimeTrading();

  useEffect(() => {
    fetchOrders();
  }, []);

  // When live orders stream from Firestore, re-sync state
  useEffect(() => {
    if (userOrders.length > 0) {
      setLoading(false);
    }
  }, [userOrders.length]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trade/order');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedOrders = async () => {
    setIsSeeding(true);
    try {
      await seedSampleData();
      soundManager.playOrderSuccess();
      toast.success('Live Demo Orders & Trades generated in Cloud Firestore!');
      await fetchOrders();
    } catch (err: any) {
      toast.error('Could not write to Firestore. Please check Firestore security rules.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this pending order?')) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/trade/order?orderId=${orderId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
        );
        toast.success('Order cancelled successfully');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    } finally {
      setCancellingId(null);
    }
  };

  // Merge server orders or live Firestore onSnapshot stream
  const effectiveOrders: Order[] =
    orders.length > 0
      ? orders
      : userOrders.map((o) => ({
          id: o.orderId || `ord_${Math.random().toString(36).substring(2, 7)}`,
          stockSymbol: o.symbol,
          type: o.side,
          orderType: 'MARKET',
          productType: o.productType || 'MIS',
          quantity: o.quantity,
          price: o.price,
          executedPrice: o.price,
          status: (o.status as any) || 'EXECUTED',
          createdAt: o.timestamp,
          executedAt: o.timestamp,
          realizedPnL: o.realizedPnL,
          executedBy: o.executedBy,
          reason: o.reason,
        }));

  const filteredOrders = effectiveOrders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'EXECUTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            FILLED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="w-3 h-3" />
            OPEN
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3 h-3" />
            CANCELLED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

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
                ORDER BOOK
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                Firestore Live Sync (0ms)
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Order History & Execution Log</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time audit log of executed trades, filled orders, realized losses, and pending bracket triggers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedOrders}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-2"
              title="Populate sample executed orders with profits & losses"
            >
              <Flame className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Writing to Firestore...' : '⚡ Populate Demo Orders'}</span>
            </button>
            <Link
              href="/stocks"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Place New Order</span>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
          {(['ALL', 'PENDING', 'EXECUTED', 'CANCELLED'] as const).map((tab) => {
            const count = tab === 'ALL' ? effectiveOrders.length : effectiveOrders.filter((o) => o.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  filter === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          {loading && effectiveOrders.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading order history from Cloud Firestore...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Orders Found</h3>
              <p className="text-xs text-slate-400 mb-5 max-w-md mx-auto">
                No orders recorded yet. Click below to populate demo trades with historical profits and losses or execute orders in Market Explorer.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSeedOrders}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all"
                >
                  <Flame className="w-4 h-4" />
                  <span>⚡ Populate Demo Trades & Losses</span>
                </button>
                <Link
                  href="/stocks"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
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
                    <th className="pb-3 pl-2">Time</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Instrument</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Order Price</th>
                    <th className="pb-3 text-right">Filled Price</th>
                    <th className="pb-3 text-right">Realized P&L</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredOrders.map((ord) => {
                    const isBuy = ord.type === 'BUY';
                    const isShort = ord.type === 'SHORT';
                    const timeFormatted = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Just now';

                    const pnl = ord.realizedPnL;
                    const hasPnL = pnl !== undefined && pnl !== null;
                    const isProfit = hasPnL && pnl > 0;
                    const isLoss = hasPnL && pnl < 0;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pl-2 text-slate-400 text-[11px]">{timeFormatted}</td>
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
                            {ord.type}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-white">
                          <Link
                            href={`/stocks/${ord.stockSymbol}`}
                            className="hover:text-blue-400 transition-colors"
                          >
                            {ord.stockSymbol}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-normal">
                              {ord.productType}
                            </span>
                            {ord.executedBy && ord.executedBy.includes('AI') && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans font-medium flex items-center gap-1">
                                <Bot className="w-2.5 h-2.5 text-purple-400" />
                                {ord.executedBy}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-300 font-semibold">{ord.orderType}</td>
                        <td className="py-3.5 text-right font-bold text-white">{ord.quantity}</td>
                        <td className="py-3.5 text-right text-slate-400">
                          {ord.price ? `₹${ord.price.toFixed(2)}` : 'Market'}
                        </td>
                        <td className="py-3.5 text-right font-bold text-emerald-400">
                          {ord.executedPrice ? `₹${ord.executedPrice.toFixed(2)}` : '---'}
                        </td>
                        <td className="py-3.5 text-right">
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
                              {isLoss && <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">LOSS</span>}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">{getStatusBadge(ord.status)}</td>
                        <td className="py-3.5 text-right pr-2">
                          {ord.status === 'PENDING' ? (
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              disabled={cancellingId === ord.id}
                              className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 ml-auto"
                            >
                              <X className="w-3 h-3" />
                              <span>{cancellingId === ord.id ? 'Cancelling...' : 'Cancel'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Closed</span>
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
