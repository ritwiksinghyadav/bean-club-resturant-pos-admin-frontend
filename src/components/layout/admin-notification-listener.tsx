'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { streamSSE } from '@/lib/sse';

export default function AdminNotificationListener() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

    let client: { close: () => void } | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      client = streamSSE(
        `${apiUrl}/admin/orders/stream`,
        token,
        (event, dataStr) => {
          if (event === 'connected') {
            setConnected(true);
          } else if (event === 'new_order') {
            const isOrdersPage =
              pathname.endsWith('/dashboard/orders') ||
              pathname.includes('/dashboard/orders');

            if (!isOrdersPage) {
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
              } catch (err) {
                console.error('Error parsing new order SSE event:', err);
              }
            }
          } else if (event === 'order_status_changed') {
            const isOrdersPage =
              pathname.endsWith('/dashboard/orders') ||
              pathname.includes('/dashboard/orders');

            if (!isOrdersPage) {
              try {
                const data = JSON.parse(dataStr);
                toast.info(
                  `🔔 Order Status Update: Token #${data.tokenNumber} is now ${data.status.toUpperCase()}`,
                  { duration: 5000 }
                );

                // Play status change notification sound
                try {
                  const audio = new Audio(
                    'https://assets.mixkit.co/active_storage/sfx/911/911-500.wav'
                  );
                  audio.volume = 0.5;
                  audio.play().catch(() => {});
                } catch {}
              } catch (err) {
                console.error('Error parsing order status change SSE:', err);
              }
            }
          }
        },
        (err) => {
          console.error('Global Admin SSE Connection error:', err);
          setConnected(false);
          if (client) client.close();
          // Retry connection after 5 seconds
          retryTimeout = setTimeout(connectSSE, 5000);
        }
      );
    };

    connectSSE();

    return () => {
      if (client) {
        client.close();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [token, pathname]);

  return null;
}
