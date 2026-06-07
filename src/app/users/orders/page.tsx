'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../cart-store';
import { 
  Receipt, 
  Loader2, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Utensils, 
  AlertTriangle,
  Lock,
  User,
  Phone,
  X,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menuItem: {
    name: string;
    imageUrl?: string;
  };
  variant?: {
    variant: {
      name: string;
    };
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  tokenNumber?: string;
  items: OrderItem[];
}

export default function CustomerOrders() {
  const token = useCartStore((state) => state.token);
  const setAuth = useCartStore((state) => state.setAuth);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auth Dialog state (for unauthenticated users)
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const fetchOrders = async (authToken: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success && data.result?.orders) {
        setOrders(data.result.orders);
      } else if (!silent) {
        toast.error('Failed to load orders.');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      if (!silent) toast.error('Network error. Failed to load orders.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!token) return;

    fetchOrders(token);

    // Auto-refresh order status silently every 8 seconds
    const interval = setInterval(() => {
      fetchOrders(token, true);
    }, 8000);

    return () => clearInterval(interval);
  }, [token]);

  if (!mounted) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authPhone) {
      toast.error('Please enter name and phone number');
      return;
    }

    setAuthLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, phoneNumber: authPhone }),
      });
      const data = await res.json();

      if (data.success && data.result) {
        const { accessToken, user } = data.result;
        const newToken = accessToken;
        setAuth(newToken, user);
        toast.success(`Welcome, ${user.name}!`);
        setIsAuthOpen(false);
        fetchOrders(newToken);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('Failed to authenticate. Try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'preparing':
        return 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse';
      case 'completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      {/* Header */}
      <header className="px-4 py-3 bg-white shadow-sm flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2 text-red-600">
          <Receipt className="w-5 h-5" />
          <h1 className="text-xl font-black tracking-tight">My Orders</h1>
        </div>
        {token && (
          <button
            onClick={() => fetchOrders(token)}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </header>

      {/* Main Panel */}
      <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {!token ? (
          /* Login Screen for Guests */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Verification Required</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-[250px] mx-auto leading-relaxed">
                Log in with your name and phone number to see your order history and earned loyalty points.
              </p>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10 active:scale-95"
            >
              Verify Customer Identity
            </button>
          </div>
        ) : loading && orders.length === 0 ? (
          /* Loading States */
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-sm font-medium">Fetching orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty Order Log */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No orders placed yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Add fresh drinks to your cart and place an order on the Menu tab.
              </p>
            </div>
          </div>
        ) : (
          /* Orders History List */
          <div className="space-y-4">
            {orders.map((order) => {
              const isPending = order.status.toLowerCase() === 'pending';
              return (
                <div
                  key={order.id}
                  className={`bg-white border shadow-sm rounded-3xl p-5 space-y-4 transition-all duration-300 ${
                    isPending 
                      ? 'border-amber-200 ring-2 ring-amber-500/5 shadow-md hover:border-amber-300' 
                      : 'border-gray-100 hover:border-red-200'
                  }`}
                >
                  {/* Order Meta Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Token #{order.tokenNumber || '---'}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusStyle(order.status)}`}>
                      {order.status === 'pending' ? 'Pending Counter Pay' : order.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Pending Token Banner & Cashier Instructions */}
                  {isPending && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 flex justify-between items-center shadow-md">
                        <div>
                          <p className="text-[8px] tracking-widest text-amber-100 font-black uppercase">PRESENT TO CASHIER</p>
                          <p className="text-3xl font-black tracking-wider">#{order.tokenNumber || '---'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] tracking-widest text-amber-100 font-black uppercase">CASH DUE</p>
                          <p className="text-2xl font-black">${parseFloat(order.totalAmount).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50/50 border border-amber-200/50 text-amber-800 rounded-2xl text-[11px] leading-normal font-medium">
                        Your order is currently <strong>Pending Payment</strong>. Go to the cashier counter, show this token code, and pay <strong>${parseFloat(order.totalAmount).toFixed(2)}</strong>. Once paid, the kitchen will begin preparation.
                      </div>
                    </div>
                  )}

                  {/* Order Items list */}
                  <div className="border-y border-dashed border-gray-200 py-3 space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="font-bold text-slate-700">{item.menuItem.name}</span>
                            {item.variant?.variant?.name && (
                              <span className="text-[9px] text-slate-500 block mt-0.5">Size: {item.variant.variant.name}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-slate-700">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total amount & points earned */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="text-slate-500 font-semibold">
                      Points Earned: <span className="font-bold text-emerald-600">+{Math.floor(parseFloat(order.totalAmount))} pts</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-bold text-[10px] mr-1.5">
                        {isPending ? 'Due' : 'Paid'}
                      </span>
                      <span className="text-red-600 font-black text-base">${parseFloat(order.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest Authentication Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" />
                Your Details
              </h3>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Please enter your details to view your orders.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Full Name</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all bg-white">
                  <User className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-medium"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Phone Number</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all bg-white">
                  <Phone className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="tel"
                    placeholder="Enter phone number..."
                    className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-medium"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3.5 rounded-xl font-bold text-sm transition-all mt-6 shadow-md shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Confirm & Verify'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
