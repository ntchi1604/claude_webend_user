import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }
  return <>{children}</>;
}
