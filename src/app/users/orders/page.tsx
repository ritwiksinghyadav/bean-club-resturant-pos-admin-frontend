'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../cart-store';
import {
  Receipt,
  Loader2,
  RefreshCw,
  ChevronDown,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Utensils
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/lib/api-client';
import { isTokenExpired } from '@/lib/jwt';
import SettingsDrawer from '../_components/SettingsDrawer';
import AuthModal from '../_components/AuthModal';

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

const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'];

function isActive(status: string) {
  return ACTIVE_STATUSES.includes(status.toLowerCase());
}

function getStatusConfig(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        label: 'Pending Pay',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        pulse: true
      };
    case 'preparing':
      return {
        label: 'Preparing',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        pulse: true
      };
    case 'ready':
      return {
        label: 'Ready!',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        pulse: true
      };
    case 'completed':
      return {
        label: 'Completed',
        bg: 'bg-slate-50',
        text: 'text-slate-500',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        pulse: false
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50',
        text: 'text-rose-500',
        border: 'border-rose-200',
        dot: 'bg-rose-400',
        pulse: false
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-50',
        text: 'text-slate-500',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        pulse: false
      };
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// ─── Compact collapsed row for past orders ─────────────────────────────────
function PastOrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const sc = getStatusConfig(order.status);
  const itemsSubtotal =
    order.items?.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0) || 0;
  const hasDiscounts =
    parseFloat(order.discount) > 0 || parseFloat(order.offerDiscount) > 0;

  // First 2 items summary
  const itemSummary = order.items
    ?.slice(0, 2)
    .map((i) => `${i.quantity}× ${i.menuItem.name}`)
    .join(', ');
  const extraItems = (order.items?.length || 0) - 2;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
        open ? 'border-red-200/60 shadow-md' : 'border-slate-100 shadow-sm'
      }`}
    >
      {/* Collapsed Row — always visible */}
      <button
        onClick={() => setOpen((p) => !p)}
        className='flex w-full items-center gap-3 px-4 py-3 text-left'
      >
        {/* Status icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${sc.bg} ${sc.text}`}
        >
          {order.status.toLowerCase() === 'completed' ? (
            <CheckCircle2 className='h-4 w-4' />
          ) : (
            <XCircle className='h-4 w-4' />
          )}
        </div>

        {/* Middle info */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <span className='text-xs font-black text-slate-800'>
              #{order.tokenNumber || '---'}
            </span>
            <span
              className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-bold ${sc.bg} ${sc.text} ${sc.border}`}
            >
              {sc.label}
            </span>
          </div>
          <p className='mt-0.5 truncate text-[10px] font-medium text-slate-400'>
            {itemSummary}
            {extraItems > 0 && ` +${extraItems} more`}
          </p>
        </div>

        {/* Right: amount + chevron */}
        <div className='flex shrink-0 items-center gap-2'>
          <span className='text-sm font-black text-slate-800'>
            ₹{parseFloat(order.totalAmount).toFixed(0)}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ChevronDown className='h-4 w-4 text-slate-400' />
          </motion.div>
        </div>
      </button>

      {/* Expanded Detail Panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key='detail'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='space-y-3 border-t border-dashed border-slate-100 px-4 pt-3 pb-4'>
              {/* Date */}
              <p className='text-[10px] font-semibold text-slate-400'>
                {formatDate(order.createdAt)}
              </p>

              {/* Items list */}
              <div className='space-y-1.5'>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className='flex items-center justify-between text-xs'
                  >
                    <div className='flex min-w-0 items-center gap-1.5'>
                      <span className='shrink-0 rounded-md border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-extrabold text-red-600'>
                        {item.quantity}×
                      </span>
                      <div className='min-w-0'>
                        <span className='block truncate font-semibold text-slate-700'>
                          {item.menuItem.name}
                        </span>
                        {item.variant?.variant?.name && (
                          <span className='text-[9px] text-slate-400'>
                            {item.variant.variant.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className='ml-2 shrink-0 font-bold text-slate-600'>
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Discount breakdown */}
              {hasDiscounts && (
                <div className='space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px]'>
                  <div className='flex justify-between text-slate-500'>
                    <span>Subtotal</span>
                    <span>₹{itemsSubtotal.toFixed(0)}</span>
                  </div>
                  {order.offer && parseFloat(order.offerDiscount) > 0 && (
                    <div className='flex justify-between font-bold text-emerald-600'>
                      <span>Offer ({order.offer.code})</span>
                      <span>
                        -₹{parseFloat(order.offerDiscount).toFixed(0)}
                      </span>
                    </div>
                  )}
                  {order.pointsRedeemed > 0 && (
                    <div className='flex justify-between font-bold text-emerald-600'>
                      <span>Points</span>
                      <span>-₹{order.pointsRedeemed}</span>
                    </div>
                  )}
                  <div className='flex justify-between border-t border-dashed border-slate-200 pt-1 text-slate-400'>
                    <span>Tax (5%)</span>
                    <span>
                      ₹
                      {(
                        (itemsSubtotal -
                          parseFloat(order.offerDiscount) -
                          order.pointsRedeemed) *
                        0.05
                      ).toFixed(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className='flex items-center justify-between'>
                <span className='text-[10px] font-semibold text-emerald-600'>
                  +{order.earnedPoints ?? 0} pts earned
                </span>
                <div>
                  <span className='mr-1 text-[10px] font-bold text-slate-400'>
                    Paid
                  </span>
                  <span className='text-sm font-black text-red-600'>
                    ₹{parseFloat(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Active order card — always expanded ──────────────────────────────────
function ActiveOrderCard({ order }: { order: Order }) {
  const sc = getStatusConfig(order.status);
  const isPending = order.status.toLowerCase() === 'pending';
  const isPreparing = order.status.toLowerCase() === 'preparing';

  return (
    <div
      className='space-y-3 rounded-2xl border bg-white p-4 shadow-sm'
      style={{
        borderColor: isPending
          ? 'rgba(245,158,11,0.4)'
          : isPreparing
            ? 'rgba(59,130,246,0.35)'
            : 'rgba(16,185,129,0.35)',
        boxShadow: isPending
          ? '0 4px 20px rgba(245,158,11,0.14)'
          : isPreparing
            ? '0 4px 20px rgba(59,130,246,0.12)'
            : '0 4px 20px rgba(16,185,129,0.12)'
      }}
    >
      {/* Status row */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold ${sc.bg} ${sc.text} ${sc.border}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${
                sc.pulse ? 'animate-pulse' : ''
              }`}
            />
            {sc.label}
          </span>
        </div>
        <span className='text-[10px] font-semibold text-slate-400'>
          {formatDate(order.createdAt)}
        </span>
      </div>

      {/* Pending Token Banner */}
      {isPending && (
        <div
          className='relative flex items-center justify-between overflow-hidden rounded-2xl p-4 text-white'
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 6px 20px rgba(245,158,11,0.35)'
          }}
        >
          <div className='pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent' />
          <div className='z-10'>
            <p className='text-[8px] font-black tracking-widest text-amber-100 uppercase'>
              SHOW TO CASHIER
            </p>
            <p className='mt-0.5 text-3xl font-black tracking-wider'>
              #{order.tokenNumber || '---'}
            </p>
          </div>
          <div className='z-10 text-right'>
            <p className='text-[8px] font-black tracking-widest text-amber-100 uppercase'>
              CASH DUE
            </p>
            <p className='mt-0.5 text-2xl font-black'>
              ₹{parseFloat(order.totalAmount).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Preparing banner */}
      {isPreparing && (
        <div
          className='flex items-center gap-3 rounded-2xl p-3.5 text-white'
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: '0 4px 16px rgba(59,130,246,0.30)'
          }}
        >
          <Utensils className='h-5 w-5 shrink-0 animate-pulse text-blue-200' />
          <div>
            <p className='text-xs font-black'>
              Kitchen is preparing your order
            </p>
            <p className='mt-0.5 text-[10px] font-medium text-blue-200'>
              Token #{order.tokenNumber || '---'} · Please wait nearby
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className='space-y-1.5 border-y border-dashed border-slate-100 py-3'>
        {order.items?.map((item) => (
          <div
            key={item.id}
            className='flex items-center justify-between text-xs'
          >
            <div className='flex min-w-0 items-center gap-1.5'>
              <span className='shrink-0 rounded-md border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-extrabold text-red-600'>
                {item.quantity}×
              </span>
              <div className='min-w-0'>
                <span className='block truncate font-semibold text-slate-700'>
                  {item.menuItem.name}
                </span>
                {item.variant?.variant?.name && (
                  <span className='text-[9px] text-slate-400'>
                    {item.variant.variant.name}
                  </span>
                )}
              </div>
            </div>
            <span className='ml-2 shrink-0 font-bold text-slate-600'>
              ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className='flex items-center justify-between'>
        <span className='text-[10px] font-semibold text-emerald-600'>
          +{order.earnedPoints ?? 0} pts earned
        </span>
        <div>
          <span className='mr-1 text-[10px] font-bold text-slate-400'>
            {isPending ? 'Due' : 'Total'}
          </span>
          <span className='text-sm font-black text-red-600'>
            ₹{parseFloat(order.totalAmount).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CustomerOrders() {
  const storeToken = useCartStore((state) => state.token);
  const storeRefreshToken = useCartStore((state) => state.refreshToken);
  const storeCustomer = useCartStore((state) => state.customer);
  const setAuth = useCartStore((state) => state.setAuth);
  const logout = useCartStore((state) => state.logout);

  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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
      const res = await fetch(`${apiUrl}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      const data = await res.json();
      if (data.success && data.result) {
        const { accessToken, refreshToken, user } = data.result;
        setAuth(accessToken, refreshToken, user);
        setToken(accessToken);
        setCustomer(user);
        toast.success(`Welcome, ${user.name}!`);
        setIsAuthOpen(false);
        fetchOrders();
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch {
      toast.error('Failed to authenticate. Try again.');
    } finally {
      setAuthLoading(false);
    }
  };

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
      if (res.status === 401) {
        if (storeToken || token) {
          logout();
        }
        if (!silent) return;
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

  useEffect(() => {
    if (!mounted) return;
    if (isTokenExpired(storeToken) && storeRefreshToken) silentReauthHelper();
  }, [mounted, storeToken, storeRefreshToken]);

  useEffect(() => {
    if (!mounted || !token) return;
    fetchOrders();

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const eventSource = new EventSource(
      `${apiUrl}/users/orders/stream?token=${token}`
    );

    eventSource.addEventListener('connected', () => {
      setSseConnected(true);
    });

    eventSource.addEventListener('order_status_changed', (event) => {
      try {
        const data = JSON.parse(event.data);
        toast.info(
          `🔔 Order Status Update: Token #${data.tokenNumber} is now ${data.status.toUpperCase()}`,
          { duration: 5000 }
        );

        // Play notification sound
        try {
          const audio = new Audio(
            'https://assets.mixkit.co/active_storage/sfx/911/911-500.wav'
          );
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}

        fetchOrders(true);
      } catch (err) {
        console.error('Error parsing order status change SSE:', err);
      }
    });

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [token, mounted]);

  useEffect(() => {
    const handlePortalRefresh = () => {
      fetchOrders();
    };

    window.addEventListener('users-portal-refresh', handlePortalRefresh);
    return () => {
      window.removeEventListener('users-portal-refresh', handlePortalRefresh);
    };
  }, [token, mounted]);

  if (!mounted) return null;

  const activeOrders = orders.filter((o) => isActive(o.status));
  const pastOrders = orders.filter((o) => !isActive(o.status));

  return (
    <div className='flex min-h-screen flex-col bg-slate-50 pb-8 font-sans text-slate-900'>
      {/* Header */}
      <header
        className='sticky top-0 z-30 flex items-center justify-between px-4 py-3.5'
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
        }}
      >
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-md shadow-red-500/30'>
            <Receipt className='h-4 w-4 text-white' />
          </div>
          <div>
            <h1 className='flex items-center gap-1.5 text-lg leading-none font-black tracking-tight text-slate-900'>
              My Orders
              <span
                className={`h-1.5 w-1.5 rounded-full ${sseConnected ? 'animate-pulse bg-green-500' : 'bg-rose-500'}`}
                title={sseConnected ? 'Live Connected' : 'Disconnected'}
              />
            </h1>
            <p className='mt-0.5 text-[10px] leading-none font-semibold tracking-wider text-red-500'>
              {activeOrders.length > 0
                ? `${activeOrders.length} ACTIVE`
                : 'ORDER HISTORY'}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {token && (
            <button
              onClick={() => fetchOrders()}
              disabled={loading}
              className='flex items-center gap-1.5 rounded-2xl bg-slate-100/80 px-3 py-1.5 text-xs font-bold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          )}
          {customer ? (
            <button
              onClick={() => setIsSettingsOpen(true)}
              title='Profile Settings'
              className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm font-black text-white shadow-md shadow-red-500/30 transition-all hover:shadow-lg hover:shadow-red-500/40 active:scale-95'
            >
              {customer.name.charAt(0).toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className='text-sm font-bold text-slate-500 transition-colors hover:text-red-600'
            >
              Log in
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className='mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 py-4'>
        {loading && orders.length === 0 ? (
          <div className='flex flex-col items-center justify-center space-y-3 py-20 text-slate-400'>
            <Loader2 className='h-8 w-8 animate-spin text-red-500' />
            <p className='text-sm font-medium'>Fetching orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className='flex flex-col items-center justify-center space-y-4 rounded-3xl border border-slate-100 bg-white p-8 py-20 text-center shadow-sm'>
            <div className='flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-300'>
              <Receipt className='h-7 w-7' />
            </div>
            <div>
              <p className='text-sm font-bold text-slate-700'>No orders yet</p>
              <p className='mx-auto mt-1 max-w-[180px] text-xs leading-relaxed text-slate-400'>
                Add items to cart and place your first order from the Menu tab.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── ACTIVE ORDERS ───────────────────────── */}
            {activeOrders.length > 0 && (
              <section className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50 px-2.5 py-1'>
                    <Zap className='h-3 w-3 text-amber-500' />
                    <span className='text-[10px] font-black tracking-wider text-amber-600 uppercase'>
                      Active Orders
                    </span>
                    <span className='flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white'>
                      {activeOrders.length}
                    </span>
                  </div>
                </div>

                <div className='space-y-3'>
                  {activeOrders.map((order) => (
                    <ActiveOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {/* ── PAST ORDERS ─────────────────────────── */}
            {pastOrders.length > 0 && (
              <section className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1'>
                    <Clock className='h-3 w-3 text-slate-400' />
                    <span className='text-[10px] font-black tracking-wider text-slate-500 uppercase'>
                      Past Orders
                    </span>
                    <span className='text-[10px] font-bold text-slate-400'>
                      {pastOrders.length}
                    </span>
                  </div>
                </div>

                <div className='space-y-2'>
                  {pastOrders.map((order) => (
                    <PastOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        authName={authName}
        authPhone={authPhone}
        onNameChange={setAuthName}
        onPhoneChange={setAuthPhone}
        loading={authLoading}
        onSubmit={handleAuthSubmit}
      /> */}
    </div>
  );
}
