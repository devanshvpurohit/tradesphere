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
} from 'lucide-react';

interface Order {
  id: string;
  stockSymbol: string;
  type: 'BUY' | 'SELL';
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
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

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
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
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
              <span className="text-xs text-slate-400">Execution Engine</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Orders & Execution Book</h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor active market orders, pending trigger limit queues, and execution timestamps.
            </p>
          </div>

          <Link
            href="/stocks"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
          >
            <Zap className="w-4 h-4" />
            <span>Place New Order</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
          {(['ALL', 'PENDING', 'EXECUTED', 'CANCELLED'] as const).map((tab) => {
            const count = tab === 'ALL' ? orders.length : orders.filter((o) => o.status === tab).length;
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
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading order history...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Orders Found</h3>
              <p className="text-xs text-slate-400 mb-5">
                No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders recorded in this session.
              </p>
              <Link
                href="/stocks"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Go to Market Explorer</span>
              </Link>
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
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredOrders.map((ord) => {
                    const isBuy = ord.type === 'BUY';
                    const timeFormatted = new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pl-2 text-slate-400 text-[11px]">{timeFormatted}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
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
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {ord.productType}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-300 font-semibold">{ord.orderType}</td>
                        <td className="py-3.5 text-right font-bold text-white">{ord.quantity}</td>
                        <td className="py-3.5 text-right text-slate-400">
                          {ord.price ? `₹${ord.price.toFixed(2)}` : 'Market'}
                        </td>
                        <td className="py-3.5 text-right font-bold text-emerald-400">
                          {ord.executedPrice ? `₹${ord.executedPrice.toFixed(2)}` : '---'}
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
