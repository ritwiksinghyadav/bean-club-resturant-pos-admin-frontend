import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // Redirect to dashboard overview
  redirect('/dashboard/overview');
}
