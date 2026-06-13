'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { streamSSE } from '@/lib/sse';
import {
  Check,
  X,
  RefreshCw,
  ChefHat,
  CircleAlert,
  CircleCheck,
  Receipt,
  User,
  Phone,
  Timer,
  Eye,
  Coins,
  Tag,
  Gift,
  Package,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { OrderTable } from './order-tables';
import { fetchWithAdminAuth } from '@/lib/api-client';
import { columns } from './order-tables/columns';
import CreateOrderDrawer from './create-order-drawer';
import { Plus } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menuItem: { name: string };
  variant?: { variant: { name: string } } | null;
}

export interface Order {
  id: string;
  status: string;
  totalAmount: string;
  tokenNumber: string;
  createdAt: string;
  type?: string;
  discount?: string;
  offerDiscount?: string;
  pointsRedeemed?: number;
  earnedPoints?: number;
  offer?: {
    code: string;
    description: string;
  } | null;
  user: { name: string; phoneNumber: string };
  items: OrderItem[];
}

interface OrderClientProps {
  initialData: {
    orders: Order[];
    stats: {
      pending: number;
      approved: number;
      preparing: number;
      completed: number;
      cancelled: number;
      all: number;
      [key: string]: number;
    };
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      perPage: number;
    };
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: 'Pending Pay',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500'
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    dot: 'bg-green-500'
  },
  preparing: {
    label: 'Preparing',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500 animate-pulse'
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    dot: 'bg-rose-500'
  }
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400'
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.color} ${cfg.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function getElapsedTime(createdAtStr: string) {
  try {
    const diffMins = Math.floor(
      (Date.now() - new Date(createdAtStr).getTime()) / 60000
    );
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
  } catch {
    return '';
  }
}

// ─── Order Detail Drawer Component ──────────────────────────────────────────────
function OrderDetailDrawer({
  order,
  isLoading,
  onClose,
  onUpdateStatus
}: {
  order: Order | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (!order && !isLoading) return null;

  return (
    <>
      <div
        className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='bg-background animate-in slide-in-from-right fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l shadow-2xl duration-300'>
        {/* Header */}
        <div className='bg-muted/30 flex items-center justify-between border-b px-6 py-4'>
          <div>
            <p className='text-muted-foreground text-xs font-bold tracking-wider uppercase'>
              Order Details
            </p>
            {order ? (
              <h2 className='text-foreground mt-0.5 flex items-center gap-2 text-xl font-black'>
                Token <span className='text-red-600'>#{order.tokenNumber}</span>
              </h2>
            ) : (
              <div className='bg-muted mt-1 h-6 w-32 animate-pulse rounded'></div>
            )}
          </div>
          <button
            onClick={onClose}
            className='bg-muted hover:bg-muted/80 text-muted-foreground rounded-full p-2 transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 space-y-5 overflow-y-auto p-6'>
          {isLoading || !order ? (
            <div className='text-muted-foreground flex flex-col items-center justify-center space-y-3 py-20'>
              <RefreshCw className='h-8 w-8 animate-spin text-red-500' />
              <p className='text-sm font-bold'>Loading Order Data...</p>
            </div>
          ) : (
            <>
              {/* Status + Time */}
              <div className='flex items-center justify-between'>
                <StatusBadge status={order.status} />
                <span className='text-muted-foreground flex items-center gap-1 text-xs font-medium'>
                  <Timer className='h-3.5 w-3.5' />
                  {getElapsedTime(order.createdAt)}
                </span>
              </div>

              {/* Customer */}
              <div className='bg-muted/20 space-y-2 rounded-xl border p-4'>
                <p className='text-muted-foreground text-[10px] font-extrabold tracking-wider uppercase'>
                  Customer &amp; Service Type
                </p>
                <div className='text-foreground flex items-center gap-2 text-sm font-bold'>
                  <User className='text-muted-foreground h-4 w-4' />
                  {order.user?.name || 'Unknown'}
                </div>
                <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold'>
                  <Phone className='h-3.5 w-3.5' />
                  {order.user?.phoneNumber || 'N/A'}
                </div>
                <div className='mt-2 flex items-center justify-between border-t pt-2'>
                  <span className='text-muted-foreground text-[10px] font-extrabold uppercase'>
                    Option:
                  </span>
                  <Badge
                    variant='secondary'
                    className={
                      order.type === 'dinein'
                        ? 'border-red-200/60 bg-red-50 font-bold text-red-700'
                        : 'border-slate-200 bg-slate-100 font-bold text-slate-700'
                    }
                  >
                    {order.type === 'dinein' ? 'Dine In' : 'Takeaway'}
                  </Badge>
                </div>
              </div>

              {/* Fully Paid with Points Warning/Notice */}
              {parseFloat(order.totalAmount) === 0 &&
                order.status === 'pending' && (
                  <div className='flex animate-pulse items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800 shadow-sm'>
                    <Coins className='h-4 w-4 shrink-0 text-emerald-600' />
                    <span>
                      Fully Paid with Points (Cashier Approval Pending)
                    </span>
                  </div>
                )}

              {/* Items */}
              <div className='bg-muted/20 space-y-3 rounded-xl border p-4'>
                <p className='text-muted-foreground flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase'>
                  <Package className='h-3.5 w-3.5' /> Order Items
                </p>
                <div className='space-y-2'>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-start justify-between text-sm'
                    >
                      <div className='flex items-start gap-2'>
                        <span className='mt-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-black text-red-700'>
                          {item.quantity}×
                        </span>
                        <div>
                          <p className='text-foreground text-sm font-bold'>
                            {item.menuItem.name}
                          </p>
                          {item.variant?.variant.name && (
                            <p className='text-muted-foreground text-[11px]'>
                              Size: {item.variant.variant.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className='text-foreground shrink-0 font-bold'>
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loyalty */}
              <div className='bg-muted/20 space-y-3 rounded-xl border p-4'>
                <p className='text-muted-foreground flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase'>
                  <Coins className='h-3.5 w-3.5' /> Points &amp; Offers
                </p>
                {(order.pointsRedeemed ?? 0) > 0 || order.offer ? (
                  <div className='space-y-2'>
                    {order.offer && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground flex items-center gap-1.5 font-medium'>
                          <Gift className='h-3.5 w-3.5 text-red-500' /> Offer
                          Applied
                        </span>
                        <span className='font-bold text-red-600'>
                          {order.offer.code}
                        </span>
                      </div>
                    )}
                    {(order.pointsRedeemed ?? 0) > 0 && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground flex items-center gap-1.5 font-medium'>
                          <Tag className='h-3.5 w-3.5 text-amber-500' /> Points
                          Redeemed
                        </span>
                        <span className='font-bold text-amber-700'>
                          {order.pointsRedeemed} pts (−₹
                          {parseFloat(
                            order.pointsRedeemed?.toString() || '0'
                          ).toFixed(2)}
                          )
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-xs'>
                    No loyalty points or promo applied.
                  </p>
                )}
                {['approved', 'preparing', 'completed'].includes(
                  order.status
                ) && (
                  <div className='mt-1 flex items-center justify-between border-t pt-2 text-sm'>
                    <span className='text-muted-foreground flex items-center gap-1.5 font-medium'>
                      <Coins className='h-3.5 w-3.5 text-green-500' /> Points
                      Earned
                    </span>
                    <span className='font-bold text-green-700'>
                      +{order.earnedPoints ?? 0} pts
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className='bg-muted/20 space-y-2.5 rounded-xl border p-4'>
                <p className='text-muted-foreground text-[10px] font-extrabold tracking-wider uppercase'>
                  Pricing
                </p>
                <div className='text-muted-foreground flex justify-between text-sm'>
                  <span>Subtotal</span>
                  <span className='text-foreground font-semibold'>
                    ₹
                    {order.items
                      .reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
                      .toFixed(2)}
                  </span>
                </div>
                {parseFloat(order.offerDiscount ?? '0') > 0 && (
                  <div className='flex justify-between text-sm text-emerald-600'>
                    <span>Offer Discount ({order.offer?.code})</span>
                    <span className='font-bold'>
                      −₹{parseFloat(order.offerDiscount ?? '0').toFixed(2)}
                    </span>
                  </div>
                )}
                {(order.pointsRedeemed ?? 0) > 0 && (
                  <div className='flex justify-between text-sm text-emerald-600'>
                    <span>Loyalty Discount</span>
                    <span className='font-bold'>
                      −₹
                      {parseFloat(
                        (order.pointsRedeemed ?? 0).toString()
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className='text-foreground mt-1 flex justify-between border-t pt-2 text-base font-black'>
                  <span>Grand Total</span>
                  <span className='text-red-600'>
                    ₹{parseFloat(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && order && (
          <div className='bg-muted/10 space-y-2 border-t px-6 py-4'>
            {order.status === 'pending' && (
              <Button
                className='w-full rounded-xl bg-green-600 font-bold text-white hover:bg-green-700'
                onClick={() => {
                  onUpdateStatus(order.id, 'preparing');
                  onClose();
                }}
              >
                <Check className='mr-1.5 h-4 w-4' /> Approve &amp; Send to
                Kitchen
              </Button>
            )}
            {order.status === 'approved' && (
              <Button
                className='w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700'
                onClick={() => {
                  onUpdateStatus(order.id, 'preparing');
                  onClose();
                }}
              >
                <ChefHat className='mr-1.5 h-4 w-4' /> Send to Kitchen
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button
                className='w-full rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700'
                onClick={() => {
                  onUpdateStatus(order.id, 'completed');
                  onClose();
                }}
              >
                <CircleCheck className='mr-1.5 h-4 w-4' /> Mark as Ready
              </Button>
            )}
            {(order.status === 'completed' || order.status === 'cancelled') && (
              <div
                className={`rounded-xl border py-2 text-center text-sm font-bold ${order.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
              >
                {order.status === 'completed'
                  ? '✓ Order Complete'
                  : '✕ Order Cancelled'}
              </div>
            )}
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <Button
                variant='outline'
                className='w-full rounded-xl border-rose-200 font-bold text-rose-600 hover:bg-rose-50'
                onClick={() => {
                  onUpdateStatus(order.id, 'cancelled');
                  onClose();
                }}
              >
                <X className='mr-1.5 h-4 w-4' /> Cancel Order
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderClient({ initialData }: OrderClientProps) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const [orders, setOrders] = useState<Order[]>(initialData.orders);
  const [stats, setStats] = useState(initialData.stats);
  const [totalItems, setTotalItems] = useState(
    initialData.pagination.totalItems
  );
  const [loading, setLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [activeTab, setActiveTab] = useQueryState(
    'status',
    parseAsString.withDefault('pending')
  );
  const [tokenSearch] = useQueryState('token', parseAsString.withDefault(''));

  const fetchSingleOrder = async (orderId: string) => {
    if (!token) return;
    setDrawerLoading(true);
    // Optimistically open drawer with stale data if we have it
    const existing = orders.find((o) => o.id === orderId);
    if (existing && !selectedOrder) setSelectedOrder(existing);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetchWithAdminAuth(`${apiUrl}/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.result?.order) {
        setSelectedOrder(data.result.order);
        // Sync row too
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.result.order : o))
        );
      }
    } catch (err) {
      toast.error('Failed to load full order details');
    } finally {
      setDrawerLoading(false);
    }
  };

  const refreshOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const statusQuery = activeTab === 'all' ? '' : activeTab;
      const tokenQueryParam = tokenSearch
        ? `&token=${encodeURIComponent(tokenSearch)}`
        : '';
      const res = await fetchWithAdminAuth(
        `${apiUrl}/admin/orders?page=${page}&perPage=${perPage}${statusQuery ? `&status=${statusQuery}` : ''}${tokenQueryParam}`,
        {
          cache: 'no-store'
        }
      );
      const data = await res.json();
      if (data.success && data.result) {
        const oldPending = stats.pending || 0;
        const newPending = data.result.stats?.pending || 0;
        if (newPending > oldPending) {
          toast.info('🔔 New customer order received!', { duration: 5000 });
        }
        setOrders(data.result.orders || []);
        setStats(
          data.result.stats || {
            pending: 0,
            approved: 0,
            preparing: 0,
            completed: 0,
            cancelled: 0,
            all: 0
          }
        );
        setTotalItems(data.result.pagination?.totalItems || 0);

        // Sync drawer if open but do not re-fetch single endpoint unless needed
        if (selectedOrder) {
          const updated = (data.result.orders || []).find(
            (o: Order) => o.id === selectedOrder.id
          );
          if (updated && !drawerLoading) setSelectedOrder(updated);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, activeTab, tokenSearch]);

  useEffect(() => {
    if (!token) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

    const client = streamSSE(
      `${apiUrl}/admin/orders/stream`,
      token,
      (event, dataStr) => {
        if (event === 'connected') {
          setSseConnected(true);
        } else if (event === 'new_order') {
          try {
            const orderData = JSON.parse(dataStr);
            toast.info(
              `🔔 New order received: Token #${orderData.tokenNumber}`,
              {
                duration: 5000
              }
            );

            // Play notification sound
            try {
              const audio = new Audio(
                'https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav'
              );
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {}

            refreshOrders();
          } catch (err) {
            console.error('Error parsing new order SSE event:', err);
          }
        } else if (event === 'order_status_changed') {
          refreshOrders();
        }
      },
      (err) => {
        console.error('SSE Connection error:', err);
        setSseConnected(false);
      }
    );

    return () => {
      client.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, perPage, activeTab, tokenSearch]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetchWithAdminAuth(
        `${apiUrl}/admin/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        refreshOrders(); // Refresh to ensure stats and lists are synced
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch {
      toast.error('Network error. Failed to update status.');
    }
  };

  const tabCount = (s: string) => stats[s] || 0;

  const onTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1); // Reset to page 1 on tab change
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <ChefHat className='h-6 w-6 animate-pulse text-red-600' />
            Kitchen &amp; Order Dashboard
          </h1>
          <p className='text-muted-foreground text-sm'>
            Manage POS counter checkouts and kitchen tickets
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold select-none'>
            <span
              className={`h-2 w-2 rounded-full ${sseConnected ? 'animate-pulse bg-green-500' : 'bg-red-500'}`}
            />
            <span>{sseConnected ? 'Realtime Connected' : 'Disconnected'}</span>
          </div>
          <Button
            size='sm'
            onClick={() => setIsCreateOrderOpen(true)}
            className='flex items-center gap-2 bg-red-600 font-semibold text-white shadow-sm shadow-red-600/10 hover:bg-red-700'
          >
            <Plus className='h-3.5 w-3.5' />
            New Order
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={refreshOrders}
            disabled={loading}
            className='flex items-center gap-2 font-semibold'
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Sync
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className='w-full'>
        <TabsList className='bg-muted/60 grid h-11 max-w-2xl grid-cols-5 border p-1'>
          {(
            ['pending', 'preparing', 'completed', 'cancelled', 'all'] as const
          ).map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className='relative text-xs font-bold capitalize'
            >
              {s === 'all' ? 'All Logs' : (STATUS_CONFIG[s]?.label ?? s)}
              {tabCount(s) > 0 && s !== 'all' && (
                <span
                  className={`absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white text-[9px] font-black text-white ${STATUS_CONFIG[s]?.dot ?? 'bg-slate-400'}`}
                >
                  {tabCount(s)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className='mt-6'>
          <div className='flex h-[calc(100vh-280px)] min-h-[400px] flex-col'>
            <OrderTable
              data={orders}
              totalItems={totalItems}
              columns={columns}
              onView={(order) => {
                setSelectedOrder(order);
                fetchSingleOrder(order.id);
              }}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isLoading={drawerLoading}
        onClose={() => {
          setSelectedOrder(null);
          setDrawerLoading(false);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      <CreateOrderDrawer
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        token={token}
        onOrderCreated={refreshOrders}
      />
    </div>
  );
}
