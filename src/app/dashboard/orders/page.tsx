import { auth } from '@/auth';
import PageContainer from '@/components/layout/page-container';
import OrderClient from '@/features/orders/components/order-client';

export const metadata = { title: 'Dashboard: Orders' };

export default async function Page() {
  const session = await auth();
  const token = (session?.user as any)?.accessToken;

  let initialOrders = [];

  try {
    if (token) {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.result?.orders) {
        initialOrders = data.result.orders;
      }
    }
  } catch (err) {
    console.error('Error fetching orders server-side:', err);
  }

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4 w-full">
        <OrderClient initialOrders={initialOrders} />
      </div>
    </PageContainer>
  );
}
