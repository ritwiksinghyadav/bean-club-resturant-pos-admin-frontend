import { auth } from '@/auth';
import PageContainer from '@/components/layout/page-container';
import UserClient from '@/features/users/components/user-client';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Customer Management'
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const session = await auth();
  const token = (session?.user as any)?.accessToken;

  const page = searchParamsCache.get('page') || 1;
  const perPage = searchParamsCache.get('perPage') || 10;
  const name = searchParamsCache.get('name') || '';

  let initialUsers = [];
  let totalItems = 0;

  try {
    if (token) {
      let url = `${API_URL}/admin/users?page=${page}&perPage=${perPage}`;
      if (name) {
        url += `&name=${encodeURIComponent(name)}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });

      const data = await res.json();
      if (data.success && data.result?.customers) {
        initialUsers = data.result.customers;
        totalItems = data.result.pagination?.totalItems || initialUsers.length;
      }
    }
  } catch (err) {
    console.error('Error fetching users server-side:', err);
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4 w-full">
        <UserClient users={initialUsers} totalItems={totalItems} />
      </div>
    </PageContainer>
  );
}
