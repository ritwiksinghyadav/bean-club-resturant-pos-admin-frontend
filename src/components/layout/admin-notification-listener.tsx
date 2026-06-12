'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminNotificationListener() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

    let eventSource: EventSource;
    let retryTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      eventSource = new EventSource(
        `${apiUrl}/admin/orders/stream?token=${token}`
      );

      eventSource.addEventListener('connected', () => {
        setConnected(true);
      });

      eventSource.addEventListener('new_order', (event) => {
        // Only show toast and play sound if NOT on the main orders dashboard page
        // to prevent duplicate notifications (since order-client.tsx already handles them locally)
        const isOrdersPage =
          pathname.endsWith('/dashboard/orders') ||
          pathname.includes('/dashboard/orders');

        if (!isOrdersPage) {
          try {
            const orderData = JSON.parse(event.data);
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
      });

      eventSource.addEventListener('order_status_changed', (event) => {
        const isOrdersPage =
          pathname.endsWith('/dashboard/orders') ||
          pathname.includes('/dashboard/orders');

        if (!isOrdersPage) {
          try {
            const data = JSON.parse(event.data);
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
      });

      eventSource.onerror = (err) => {
        console.error('Global Admin SSE Connection error:', err);
        setConnected(false);
        eventSource.close();
        // Retry connection after 5 seconds
        retryTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [token, pathname]);

  return null;
}
