'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
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
  Package,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { OrderTable } from './order-tables';
import { columns } from './order-tables/columns';

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
  discount?: string;
  pointsRedeemed?: number;
  user: { name: string; phoneNumber: string };
  items: OrderItem[];
}

interface OrderClientProps {
  initialData: {
    orders: Order[];
    stats: { pending: number; approved: number; preparing: number; completed: number; cancelled: number; all: number; [key: string]: number };
    pagination: { totalItems: number; totalPages: number; currentPage: number; perPage: number; };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: 'Pending Pay',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500' },
  approved:  { label: 'Approved',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   dot: 'bg-green-500' },
  preparing: { label: 'Preparing',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500 animate-pulse' },
  completed: { label: 'Completed',    color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled',    color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-200',     dot: 'bg-rose-500' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.color} ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function getElapsedTime(createdAtStr: string) {
  try {
    const diffMins = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
  } catch { return ''; }
}

// ─── Order Detail Drawer Component ──────────────────────────────────────────────
function OrderDetailDrawer({
  order,
  isLoading,
  onClose,
  onUpdateStatus,
}: {
  order: Order | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (!order && !isLoading) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-background border-l shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Details</p>
            {order ? (
              <h2 className="text-xl font-black text-foreground mt-0.5 flex items-center gap-2">
                Token <span className="text-red-600">#{order.tokenNumber}</span>
              </h2>
            ) : (
              <div className="h-6 w-32 bg-muted rounded animate-pulse mt-1"></div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading || !order ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-sm font-bold">Loading Order Data...</p>
            </div>
          ) : (
            <>
              {/* Status + Time */}
              <div className="flex items-center justify-between">
                <StatusBadge status={order.status} />
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5" />
                  {getElapsedTime(order.createdAt)}
                </span>
              </div>

              {/* Customer */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Customer</p>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {order.user?.name || 'Unknown'}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  {order.user?.phoneNumber || 'N/A'}
                </div>
              </div>

              {/* Items */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Order Items
                </p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex items-start gap-2">
                        <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded mt-0.5">
                          {item.quantity}×
                        </span>
                        <div>
                          <p className="font-bold text-foreground text-sm">{item.menuItem.name}</p>
                          {item.variant?.variant.name && (
                            <p className="text-[11px] text-muted-foreground">Size: {item.variant.variant.name}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-foreground shrink-0">
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loyalty */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Points &amp; Offers
                </p>
                {(order.pointsRedeemed ?? 0) > 0 ? (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-500" /> Points Redeemed
                    </span>
                    <span className="font-bold text-amber-700">{order.pointsRedeemed} pts (−₹{parseFloat(order.discount ?? '0').toFixed(2)})</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No loyalty points or promo applied.</p>
                )}
                {(order.status === 'approved' || order.status === 'completed') && (
                  <div className="flex justify-between items-center text-sm border-t pt-2 mt-1">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-green-500" /> Points Earned
                    </span>
                    <span className="font-bold text-green-700">+{Math.floor(parseFloat(order.totalAmount))} pts</span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Pricing</p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">
                    ₹{order.items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(2)}
                  </span>
                </div>
                {parseFloat(order.discount ?? '0') > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Loyalty Discount</span>
                    <span className="font-bold">−₹{parseFloat(order.discount ?? '0').toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black border-t pt-2 mt-1 text-foreground">
                  <span>Grand Total</span>
                  <span className="text-red-600">₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && order && (
          <div className="px-6 py-4 border-t bg-muted/10 space-y-2">
            {order.status === 'pending' && (
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl" onClick={() => { onUpdateStatus(order.id, 'preparing'); onClose(); }}>
                <Check className="w-4 h-4 mr-1.5" /> Approve &amp; Send to Kitchen
              </Button>
            )}
            {order.status === 'approved' && (
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl" onClick={() => { onUpdateStatus(order.id, 'preparing'); onClose(); }}>
                <ChefHat className="w-4 h-4 mr-1.5" /> Send to Kitchen
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl" onClick={() => { onUpdateStatus(order.id, 'completed'); onClose(); }}>
                <CircleCheck className="w-4 h-4 mr-1.5" /> Mark as Ready
              </Button>
            )}
            {(order.status === 'completed' || order.status === 'cancelled') && (
              <div className={`text-center text-sm font-bold py-2 rounded-xl border ${order.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                {order.status === 'completed' ? '✓ Order Complete' : '✕ Order Cancelled'}
              </div>
            )}
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <Button variant="outline" className="w-full font-bold rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => { onUpdateStatus(order.id, 'cancelled'); onClose(); }}>
                <X className="w-4 h-4 mr-1.5" /> Cancel Order
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
  const [totalItems, setTotalItems] = useState(initialData.pagination.totalItems);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [activeTab, setActiveTab] = useQueryState('status', parseAsString.withDefault('pending'));

  const fetchSingleOrder = async (orderId: string) => {
    if (!token) return;
    setDrawerLoading(true);
    // Optimistically open drawer with stale data if we have it
    const existing = orders.find(o => o.id === orderId);
    if (existing && !selectedOrder) setSelectedOrder(existing);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.result?.order) {
        setSelectedOrder(data.result.order);
        // Sync row too
        setOrders(prev => prev.map(o => o.id === orderId ? data.result.order : o));
      }
    } catch (err) {
      toast.error("Failed to load full order details");
    } finally {
      setDrawerLoading(false);
    }
  };

  const refreshOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const statusQuery = activeTab === 'all' ? '' : activeTab;
      const res = await fetch(`${apiUrl}/admin/orders?page=${page}&perPage=${perPage}${statusQuery ? `&status=${statusQuery}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.result) {
        const oldPending = stats.pending || 0;
        const newPending = data.result.stats?.pending || 0;
        if (newPending > oldPending) {
          toast.info('🔔 New customer order received!', { duration: 5000 });
        }
        setOrders(data.result.orders || []);
        setStats(data.result.stats || { pending: 0, approved: 0, preparing: 0, completed: 0, cancelled: 0, all: 0 });
        setTotalItems(data.result.pagination?.totalItems || 0);

        // Sync drawer if open but do not re-fetch single endpoint unless needed
        if (selectedOrder) {
          const updated = (data.result.orders || []).find((o: Order) => o.id === selectedOrder.id);
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
  }, [page, perPage, activeTab]);

  useEffect(() => {
    if (!autoRefresh || !token) return;
    const interval = setInterval(refreshOrders, 8000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, token, page, perPage, activeTab]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-red-600 animate-pulse" />
            Kitchen &amp; Order Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Manage POS counter checkouts and kitchen tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-muted/40 border px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted/80 transition-all select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded text-red-600"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh (8s)
          </label>
          <Button size="sm" variant="outline" onClick={refreshOrders} disabled={loading} className="flex items-center gap-2 font-semibold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 max-w-2xl h-11 p-1 bg-muted/60 border">
          {(['pending','preparing','completed','cancelled','all'] as const).map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs font-bold relative capitalize">
              {s === 'all' ? 'All Logs' : STATUS_CONFIG[s]?.label ?? s}
              {tabCount(s) > 0 && s !== 'all' && (
                <span className={`absolute -top-1.5 -right-1 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white ${STATUS_CONFIG[s]?.dot ?? 'bg-slate-400'}`}>
                  {tabCount(s)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="h-[calc(100vh-280px)] min-h-[400px] flex flex-col">
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
        onClose={() => { setSelectedOrder(null); setDrawerLoading(false); }}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
