'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../cart-store';
import { 
  Receipt, 
  Loader2, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Coffee, 
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

  const fetchOrders = async (authToken: string) => {
    setLoading(true);
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
      } else {
        toast.error('Failed to load orders.');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Network error. Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (token) {
      fetchOrders(token);
    }
  }, [token]);

  if (!mounted) return null;

  // Handle Authentication for guest
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
        const { token: newToken, user } = data.result;
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

  // Helper for Status Badge styling
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'preparing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
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
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 py-5 bg-gradient-to-b from-[#1c120e] to-transparent border-b border-[#2d1b13]/20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-amber-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            My Orders
          </h1>
          <p className="text-xs text-neutral-400">Track your order logs</p>
        </div>
        {token && (
          <button
            onClick={() => fetchOrders(token)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#1c130f]/60 hover:bg-[#281b16] border border-[#2d1b13]/40 text-neutral-300 hover:text-amber-500 transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </header>

      {/* Main Panel */}
      <div className="flex-1 px-6 py-4">
        {!token ? (
          /* Login Screen for Guests */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#1c130f] border border-[#2d1b13]/40 flex items-center justify-center text-amber-500 shadow-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-100">Verification Required</h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-[250px] mx-auto leading-relaxed">
                Log in with your name and phone number to see your order history and earned loyalty points.
              </p>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-amber-950/20 active:scale-95 transition-all"
            >
              Verify Customer Identity
            </button>
          </div>
        ) : loading && orders.length === 0 ? (
          /* Loading States */
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Fetching order updates...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty Order Log */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#1c130f] border border-[#2d1b13]/40 flex items-center justify-center text-amber-500/40">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-100">No orders placed yet</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Add fresh drinks to your cart and place an order on the Menu tab.
              </p>
            </div>
          </div>
        ) : (
          /* Orders History List */
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[#18100d]/90 border border-[#2d1b13]/40 rounded-3xl p-5 space-y-4 hover:border-[#4d3225]/45 transition-all duration-300"
              >
                {/* Order Meta Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-extrabold text-amber-100">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                {/* Order Items list */}
                <div className="border-y border-[#2d1b13]/20 py-3 space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold text-amber-500 bg-[#2d1b13]/30 px-2 py-0.5 rounded-md">
                          {item.quantity}x
                        </span>
                        <div>
                          <span className="font-semibold text-neutral-200">{item.menuItem.name}</span>
                          {item.variant?.variant?.name && (
                            <span className="text-[10px] text-neutral-400 block mt-0.5">Size: {item.variant.variant.name}</span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-neutral-300">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total amount & points earned */}
                <div className="flex justify-between items-center text-xs">
                  <div className="text-neutral-400">
                    Points Earned: <span className="font-bold text-emerald-500">+{Math.floor(parseFloat(order.totalAmount))} pts</span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-400 font-medium text-[11px] mr-1.5">Total Paid</span>
                    <span className="text-amber-500 font-extrabold text-sm">${parseFloat(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest Authentication Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#160f0c] border border-[#2d1b13]/60 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-amber-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                Customer Verification
              </h3>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="p-1 rounded-full bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Verify your name and phone number to earn loyalty points and view your orders.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="relative flex items-center bg-[#1c130f]/60 border border-[#2d1b13]/40 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-all">
                <User className="w-4 h-4 text-neutral-500 mr-2" />
                <input
                  type="text"
                  placeholder="Your Name"
                  className="bg-transparent text-xs w-full outline-none text-neutral-100 placeholder-neutral-500"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                />
              </div>

              <div className="relative flex items-center bg-[#1c130f]/60 border border-[#2d1b13]/40 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-all">
                <Phone className="w-4 h-4 text-neutral-500 mr-2" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="bg-transparent text-xs w-full outline-none text-neutral-100 placeholder-neutral-500"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white py-3.5 rounded-2xl font-bold text-xs transition-all duration-200 flex justify-center items-center gap-1.5"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Authenticating...
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
