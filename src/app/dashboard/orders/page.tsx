import { auth } from '@/auth';
import PageContainer from '@/components/layout/page-container';
import OrderClient from '@/features/orders/components/order-client';

export const metadata = { title: 'Dashboard: Orders' };

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const token = (session?.user as any)?.accessToken;

  let initialData = {
    orders: [],
    stats: {
      pending: 0,
      approved: 0,
      preparing: 0,
      completed: 0,
      cancelled: 0,
      all: 0
    },
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1, perPage: 10 }
  };

  try {
    if (token) {
      const page = searchParams.page || 1;
      const perPage = searchParams.perPage || 10;
      const status = searchParams.status || 'pending';
      const statusQuery = status === 'all' ? '' : status;
      const tokenQuery = (searchParams.token as string) || '';

      let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders?page=${page}&perPage=${perPage}${statusQuery ? `&status=${statusQuery}` : ''}`;
      if (tokenQuery) {
        url += `&token=${encodeURIComponent(tokenQuery)}`;
      }

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
      <div className='flex w-full flex-1 flex-col space-y-4'>
        <OrderClient initialData={initialData} />
      </div>
    </PageContainer>
  );
}
