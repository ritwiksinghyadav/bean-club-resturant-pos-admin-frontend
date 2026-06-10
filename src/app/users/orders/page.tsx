'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { fetchWithAuth } from '@/lib/api-client';

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
  earnedPoints?: number;
  discount: string;
  offerDiscount: string;
  pointsRedeemed: number;
  offer?: {
    code: string;
    description: string;
  } | null;
  items: OrderItem[];
}

export default function CustomerOrders() {
  const storeToken = useCartStore((state) => state.token);
  const storeRefreshToken = useCartStore((state) => state.refreshToken);
  const storeCustomer = useCartStore((state) => state.customer);
  const setAuth = useCartStore((state) => state.setAuth);

  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auth Dialog state (for unauthenticated users)
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const silentReauthHelper = async (): Promise<string | null> => {
    try {
      if (!storeRefreshToken) return null;
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storeRefreshToken })
      });

      if (res.status >= 400 && res.status < 500) {
        setAuth(null, null, null);
        setToken(null);
        setCustomer(null);
        return null;
      }

      const data = await res.json();
      if (data.success && data.result) {
        const { accessToken, refreshToken, user } = data.result;
        setAuth(accessToken, refreshToken, user);
        setToken(accessToken);
        setCustomer(user);
        return accessToken;
      }
      return null;
    } catch (err) {
      console.error('Silent reauth helper network/server error:', err);
      return null;
    }
  };

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetchWithAuth(`${apiUrl}/users/orders`);

      if (res.status === 401 && !silent) {
        setIsAuthOpen(true);
        return;
      }

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
  }, []);

  useEffect(() => {
    if (mounted) {
      setToken(storeToken);
      setCustomer(storeCustomer);
    }
  }, [mounted, storeToken, storeCustomer]);

  // Silent re-authentication check on mount
  useEffect(() => {
    if (!mounted) return;
    if (!storeToken && storeRefreshToken) {
      silentReauthHelper();
    }
  }, [mounted, storeToken, storeRefreshToken]);

  useEffect(() => {
    if (!mounted || !token) return;

    fetchOrders();

    // Auto-refresh order status silently every 8 seconds
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [token, mounted]);

  if (!mounted) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authPhone) {
      toast.error('Please enter name and phone number');
      return;
    }

    setAuthLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const requestPayload = { name: authName, phoneNumber: authPhone };
      console.log(
        `[Customer Legacy Login API Request]: URL=${apiUrl}/users/auth/login, Payload=`,
        requestPayload
      );
      const res = await fetch(`${apiUrl}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      const data = await res.json();
      console.log(
        `[Customer Legacy Login API Response]: Status=${res.status}, Body=`,
        data
      );

      if (data.success && data.result) {
        const { accessToken, refreshToken, user } = data.result;
        setAuth(accessToken, refreshToken, user);
        toast.success(`Welcome, ${user.name}!`);
        setIsAuthOpen(false);
        fetchOrders();
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
    <div className='flex min-h-screen flex-col bg-slate-50 pb-8 font-sans text-slate-900'>
      {/* Header */}
      <header className='sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-sm'>
        <div className='flex items-center gap-2 text-red-600'>
          <Receipt className='h-5 w-5' />
          <h1 className='text-xl font-black tracking-tight'>My Orders</h1>
        </div>
        {token && (
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className='rounded-xl border border-gray-200 bg-white p-2 text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50'
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </header>

      {/* Main Panel */}
      <div className='mx-auto w-full max-w-2xl flex-1 px-4 py-4'>
        {loading && orders.length === 0 ? (
          /* Loading States */
          <div className='flex flex-col items-center justify-center space-y-3 py-20 text-slate-500'>
            <Loader2 className='h-8 w-8 animate-spin text-red-500' />
            <p className='text-sm font-medium'>Fetching orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty Order Log */
          <div className='flex flex-col items-center justify-center space-y-4 rounded-3xl border border-gray-100 bg-white p-6 py-20 text-center shadow-sm'>
            <div className='flex h-16 w-16 items-center justify-center rounded-3xl border border-gray-100 bg-slate-50 text-slate-400'>
              <Receipt className='h-6 w-6' />
            </div>
            <div>
              <p className='text-sm font-bold text-slate-700'>
                No orders placed yet
              </p>
              <p className='mx-auto mt-1 max-w-[200px] text-xs leading-relaxed text-slate-500'>
                Add fresh drinks to your cart and place an order on the Menu
                tab.
              </p>
            </div>
          </div>
        ) : (
          /* Orders History List */
          <div className='space-y-4'>
            {orders.map((order) => {
              const isPending = order.status.toLowerCase() === 'pending';
              const itemsSubtotal =
                order.items?.reduce(
                  (s, i) => s + parseFloat(i.price) * i.quantity,
                  0
                ) || 0;
              const hasDiscounts =
                parseFloat(order.discount) > 0 ||
                parseFloat(order.offerDiscount) > 0;

              return (
                <div
                  key={order.id}
                  className={`space-y-4 rounded-3xl border bg-white p-5 shadow-sm transition-all duration-300 ${
                    isPending
                      ? 'border-amber-200 shadow-md ring-2 ring-amber-500/5 hover:border-amber-300'
                      : 'border-gray-100 hover:border-red-200'
                  }`}
                >
                  {/* Order Meta Info */}
                  <div className='flex items-start justify-between'>
                    <div>
                      <h3 className='text-sm font-bold text-slate-800'>
                        Token #{order.tokenNumber || '---'}
                      </h3>
                      <p className='mt-1 text-[10px] font-semibold text-slate-500'>
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(order.status)}`}
                    >
                      {order.status === 'pending'
                        ? 'Pending Counter Pay'
                        : order.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Pending Token Banner & Cashier Instructions */}
                  {isPending && (
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white shadow-md'>
                        <div>
                          <p className='text-[8px] font-black tracking-widest text-amber-100 uppercase'>
                            PRESENT TO CASHIER
                          </p>
                          <p className='text-3xl font-black tracking-wider'>
                            #{order.tokenNumber || '---'}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-[8px] font-black tracking-widest text-amber-100 uppercase'>
                            CASH DUE
                          </p>
                          <p className='text-2xl font-black'>
                            ₹{parseFloat(order.totalAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className='rounded-2xl border border-amber-200/50 bg-amber-50/50 p-3 text-[11px] leading-normal font-medium text-amber-800'>
                        Your order is currently <strong>Pending Payment</strong>
                        . Go to the cashier counter, show this token code, and
                        pay{' '}
                        <strong>
                          ₹{parseFloat(order.totalAmount).toFixed(2)}
                        </strong>
                        . Once paid, the kitchen will begin preparation.
                      </div>
                    </div>
                  )}

                  {/* Order Items list */}
                  <div className='space-y-2 border-y border-dashed border-gray-200 py-3'>
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className='flex items-center justify-between text-xs font-medium text-slate-600'
                      >
                        <div className='flex items-center gap-1.5'>
                          <span className='rounded-md border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-extrabold text-red-600'>
                            {item.quantity}x
                          </span>
                          <div>
                            <span className='font-bold text-slate-700'>
                              {item.menuItem.name}
                            </span>
                            {item.variant?.variant?.name && (
                              <span className='mt-0.5 block text-[9px] text-slate-500'>
                                Size: {item.variant.variant.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className='font-bold text-slate-700'>
                          ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Detailed receipt breakdown if discount or offer exists */}
                  {hasDiscounts && (
                    <div className='space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs'>
                      <div className='flex justify-between font-semibold text-slate-500'>
                        <span>Subtotal</span>
                        <span>₹{itemsSubtotal.toFixed(2)}</span>
                      </div>
                      {order.offer && parseFloat(order.offerDiscount) > 0 && (
                        <div className='flex justify-between font-bold text-emerald-600'>
                          <span>Offer ({order.offer.code})</span>
                          <span>
                            -₹{parseFloat(order.offerDiscount).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {order.pointsRedeemed > 0 && (
                        <div className='flex justify-between font-bold text-emerald-600'>
                          <span>Points Discount</span>
                          <span>
                            -₹
                            {parseFloat(
                              order.pointsRedeemed.toString()
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className='flex justify-between border-t border-dashed pt-1.5 font-semibold text-slate-500'>
                        <span>Taxes &amp; Charges (5%)</span>
                        <span>
                          ₹
                          {(
                            (itemsSubtotal -
                              parseFloat(order.offerDiscount) -
                              order.pointsRedeemed) *
                            0.05
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total amount & points earned */}
                  <div className='flex items-center justify-between text-xs'>
                    <div className='font-semibold text-slate-500'>
                      Points Earned:{' '}
                      <span className='font-bold text-emerald-600'>
                        +{order.earnedPoints ?? 0} pts
                      </span>
                    </div>
                    <div className='text-right'>
                      <span className='mr-1.5 text-[10px] font-bold text-slate-400'>
                        {isPending ? 'Due' : 'Paid'}
                      </span>
                      <span className='text-base font-black text-red-600'>
                        ₹{parseFloat(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
