import { auth } from '@/auth';
import PageContainer from '@/components/layout/page-container';
import AdminClient from '@/features/admins/components/admin-client';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Admin Management'
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

  let initialAdmins = [];
  let roles = [];
  let totalItems = 0;

  try {
    if (token) {
      let url = `${API_URL}/admin/admins?page=${page}&perPage=${perPage}`;
      if (name) {
        url += `&name=${encodeURIComponent(name)}`;
      }

      // Fetch admins and roles concurrently
      const [adminsRes, rolesRes] = await Promise.all([
        fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: 'no-store'
        }),
        fetch(`${API_URL}/admin/roles`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: 'no-store'
        })
      ]);

      const adminsData = await adminsRes.json();
      if (adminsData.success && adminsData.result?.admins) {
        initialAdmins = adminsData.result.admins;
        totalItems = adminsData.result.pagination?.totalItems || initialAdmins.length;
      }

      const rolesData = await rolesRes.json();
      if (rolesData.success && rolesData.result?.roles) {
        roles = rolesData.result.roles;
      }
    }
  } catch (err) {
    console.error('Error fetching admins server-side:', err);
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4 w-full">
        <AdminClient admins={initialAdmins} roles={roles} totalItems={totalItems} />
      </div>
    </PageContainer>
  );
}
