'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

interface Order {
  id: string;
  stockSymbol: string;
  type: string;
  orderType: string;
  productType: string;
  quantity: number;
  price: number | null;
  triggerPrice: number | null;
  targetPrice: number | null;
  stopLoss: number | null;
  status: string;
  executedPrice: number | null;
  executedAt: string | null;
  createdAt: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/trade/order');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'ALL') return true;
    return order.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      EXECUTED: 'bg-green-50 text-green-700 border-green-200',
      CANCELLED: 'bg-gray-50 text-gray-700 border-gray-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase border ${
          styles[status as keyof typeof styles] || styles.PENDING
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <TopNav />
        <div className="ml-64 pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl text-gray-900">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <TopNav />
      <div className="ml-64 pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
            <p className="text-gray-600">View and manage your trading orders</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex gap-2 p-2">
              {(['ALL', 'PENDING', 'EXECUTED', 'CANCELLED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                  <span className="ml-2 text-xs opacity-75">
                    ({orders.filter((o) => tab === 'ALL' || o.status === tab).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">receipt_long</span>
              <p className="text-gray-600 text-lg">No {filter.toLowerCase()} orders found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Order Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">show_chart</span>
                            <span className="text-sm font-bold text-gray-900">{order.stockSymbol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              order.type === 'BUY'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {order.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {order.productType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {order.status === 'EXECUTED' && order.executedPrice ? (
                            <div>
                              <div className="font-bold">₹{order.executedPrice.toFixed(2)}</div>
                              {order.price && order.price !== order.executedPrice && (
                                <div className="text-xs text-gray-500">
                                  Limit: ₹{order.price.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : order.price ? (
                            <div>
                              <div className="font-medium">₹{order.price.toFixed(2)}</div>
                              {order.triggerPrice && (
                                <div className="text-xs text-gray-500">
                                  Trigger: ₹{order.triggerPrice.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">Market</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(order.status)}
                          {order.executedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(order.executedAt).toLocaleTimeString('en-IN', {
                                timeStyle: 'short',
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
