import { auth } from '@/auth';
import PageContainer from '@/components/layout/page-container';
import OrderClient from '@/features/orders/components/order-client';

export const metadata = { title: 'Dashboard: Orders' };

export default async function Page({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  const token = (session?.user as any)?.accessToken;

  let initialData = {
    orders: [],
    stats: { pending: 0, approved: 0, preparing: 0, completed: 0, cancelled: 0, all: 0 },
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1, perPage: 10 }
  };

  try {
    if (token) {
      const page = searchParams.page || 1;
      const perPage = searchParams.perPage || 10;
      const status = searchParams.status || 'pending';
      const statusQuery = status === 'all' ? '' : status;

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders?page=${page}&perPage=${perPage}${statusQuery ? `&status=${statusQuery}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.result) {
        initialData = data.result;
      }
    }
  } catch (err) {
    console.error('Error fetching orders server-side:', err);
  }

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4 w-full">
        <OrderClient initialData={initialData} />
      </div>
    </PageContainer>
  );
}
