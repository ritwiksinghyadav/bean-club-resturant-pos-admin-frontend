'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Check, 
  Clock, 
  X, 
  RefreshCw, 
  ChefHat, 
  CircleAlert, 
  CircleCheck, 
  Receipt,
  User,
  Phone,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  menuItem: {
    name: string;
  };
  variant?: {
    variant: {
      name: string;
    };
  } | null;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  tokenNumber: string;
  createdAt: string;
  user: {
    name: string;
    phoneNumber: string;
  };
  items: OrderItem[];
}

interface OrderClientProps {
  initialOrders: Order[];
}

export default function OrderClient({ initialOrders }: OrderClientProps) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch orders from API
  const refreshOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.result?.orders) {
        // Play sound or alert if new pending order arrives
        const oldPendingCount = orders.filter(o => o.status === 'pending').length;
        const newPendingCount = data.result.orders.filter((o: any) => o.status === 'pending').length;
        if (newPendingCount > oldPendingCount) {
          toast.info('New customer order received!', {
            icon: '🔔',
            duration: 5000
          });
        }
        setOrders(data.result.orders);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh loop
  useEffect(() => {
    if (!autoRefresh || !token) return;
    const interval = setInterval(() => {
      refreshOrders();
    }, 8000); // refresh every 8 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, token, orders]);

  // Update order status API call
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        // Optimistic UI Update
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      toast.error('Network error. Failed to update status.');
    }
  };

  const getElapsedTime = (createdAtStr: string) => {
    try {
      const diffMs = new Date().getTime() - new Date(createdAtStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      return `${diffMins} mins ago`;
    } catch (e) {
      return '';
    }
  };

  // Filter orders based on active tab selection
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-red-600 animate-pulse" />
            Kitchen & Order Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Manage POS counter checkouts and kitchen tickets</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-muted/40 border px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted/80 transition-all select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh (8s)
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshOrders}
            disabled={loading}
            className="flex items-center gap-2 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 max-w-xl h-11 p-1 bg-muted/60 border">
          <TabsTrigger value="pending" className="text-xs font-bold relative">
            Pending Pay
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="text-xs font-bold relative">
            Kitchen (Prep)
            {orders.filter(o => o.status === 'preparing').length > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-blue-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                {orders.filter(o => o.status === 'preparing').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs font-bold">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs font-bold">Cancelled</TabsTrigger>
          <TabsTrigger value="all" className="text-xs font-bold">All Logs</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl bg-muted/20 border-dashed">
              <Receipt className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-bold text-sm">No orders found</h3>
              <p className="text-xs text-muted-foreground mt-1">There are no orders matching status: {activeTab}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <Card 
                  key={order.id}
                  className={`border shadow-sm rounded-2xl overflow-hidden transition-all ${
                    order.status === 'pending' ? 'border-amber-200 ring-1 ring-amber-500/10' :
                    order.status === 'preparing' ? 'border-blue-200 ring-1 ring-blue-500/10' : ''
                  }`}
                >
                  <CardHeader className="pb-3 border-b bg-muted/30 flex flex-row justify-between items-start space-y-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-red-600">
                          #{order.tokenNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold py-0.5">
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mt-1">
                        <Timer className="w-3 h-3 text-red-500" />
                        Placed {getElapsedTime(order.createdAt)}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium">Bill Due</p>
                      <p className="text-base font-black text-slate-800">${parseFloat(order.totalAmount).toFixed(2)}</p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Customer */}
                    <div className="space-y-1.5 p-3 bg-muted/20 rounded-xl border">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {order.user.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {order.user.phoneNumber}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Ticket Items</p>
                      <div className="space-y-2 border-t pt-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                                {item.quantity}x
                              </span>
                              <div>
                                <span className="font-bold text-slate-800">{item.menuItem.name}</span>
                                {item.variant?.variant.name && (
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">Size: {item.variant.variant.name}</span>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-slate-700">
                              ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 rounded-xl"
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="font-bold text-xs py-2 px-3 rounded-xl"
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl"
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                        >
                          <CircleCheck className="w-3.5 h-3.5 mr-1.5" />
                          Done (Ready)
                        </Button>
                      )}

                      {order.status === 'completed' && (
                        <div className="w-full flex items-center justify-center gap-1.5 p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold">
                          <CircleCheck className="w-4 h-4" />
                          Order Complete
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="w-full flex items-center justify-center gap-1.5 p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold">
                          <CircleAlert className="w-4 h-4" />
                          Cancelled
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
