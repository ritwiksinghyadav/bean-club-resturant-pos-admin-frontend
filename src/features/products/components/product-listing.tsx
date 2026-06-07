import { auth } from '@/auth';
import ProductClient from './product-client';
import { searchParamsCache } from '@/lib/searchparams';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default async function ProductListingPage() {
  const session = await auth();
  const token = (session?.user as any)?.accessToken;

  const categoryId = searchParamsCache.get('category');
  const page = searchParamsCache.get('page') || 1;
  const perPage = searchParamsCache.get('perPage') || 10;
  const search = searchParamsCache.get('name') || '';

  let products = [];
  let categories = [];
  let totalItems = 0;

  try {
    if (token) {
      // Fetch categories
      const catRes = await fetch(`${API_URL}/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      const catData = await catRes.json();
      if (catData.success && catData.result?.categories) {
        categories = catData.result.categories;
      }

      // Fetch tags
      const tagRes = await fetch(`${API_URL}/admin/tags`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      const tagData = await tagRes.json();
      var tags = [];
      if (tagData.success && tagData.result?.tags) {
        tags = tagData.result.tags;
      }

      // Fetch variants
      const varRes = await fetch(`${API_URL}/admin/variants`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      const varData = await varRes.json();
      var variantsList = [];
      if (varData.success && varData.result?.variants) {
        variantsList = varData.result.variants;
      }

      // Fetch products with backend pagination, searching
      let url = `${API_URL}/admin/menu-items?page=${page}&perPage=${perPage}`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }
      if (search) {
        url += `&name=${encodeURIComponent(search)}`;
      }
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.result?.menuItems) {
        products = data.result.menuItems;
        totalItems = data.result.pagination?.totalItems || products.length;
      }
    }
  } catch (err) {
    console.error('Error fetching products server-side:', err);
  }

  return (
    <ProductClient
      products={products}
      categories={categories}
      tags={tags || []}
      masterVariants={variantsList || []}
      totalItems={totalItems}
    />
  );
}


