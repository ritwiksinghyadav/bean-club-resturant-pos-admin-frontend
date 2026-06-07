import { redirect } from 'next/navigation';

export default async function Page() {
  // For now, redirect directly to dashboard
  // You can implement your own authentication logic here
  redirect('/dashboard/overview');
}
