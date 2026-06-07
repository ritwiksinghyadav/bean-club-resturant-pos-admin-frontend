import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';

type TProductViewPageProps = {
  productId: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  const session = await auth();
  const token = (session?.user as any)?.accessToken;

  let product = null;
  let categories = [];
  let tags = [];
  let masterVariants = [];
  let pageTitle = 'Create New Product';

  try {
    if (token) {
      // Fetch categories for the dropdown selector
      const catRes = await fetch(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const catData = await catRes.json();
      if (catData.success && catData.result?.categories) {
        categories = catData.result.categories;
      }

      // Fetch tags list
      const tagRes = await fetch(`${API_URL}/admin/tags`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const tagData = await tagRes.json();
      if (tagData.success && tagData.result?.tags) {
        tags = tagData.result.tags;
      }

      // Fetch variants list
      const varRes = await fetch(`${API_URL}/admin/variants`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const varData = await varRes.json();
      if (varData.success && varData.result?.variants) {
        masterVariants = varData.result.variants;
      }

      if (productId !== 'new') {
        const prodRes = await fetch(`${API_URL}/admin/menu-items`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        const prodData = await prodRes.json();
        if (prodData.success && prodData.result?.menuItems) {
          product = prodData.result.menuItems.find((p: any) => p.id === productId) || null;
        }
        
        if (!product) {
          notFound();
        }
        pageTitle = 'Edit Product';
      }
    }
  } catch (err) {
    console.error('Error fetching data in ProductViewPage:', err);
  }

  return (
    <ProductForm 
      initialData={product} 
      categories={categories} 
      tags={tags}
      masterVariants={masterVariants}
      pageTitle={pageTitle} 
    />
  );
}
