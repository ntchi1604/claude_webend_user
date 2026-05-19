import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { LogOut, Key, BarChart3, CreditCard, Package, BookOpen } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import MobileNav from '@/components/mobile-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const nav = [
    { href: '/dashboard', label: 'Tổng quan', icon: BarChart3 },
    { href: '/dashboard/keys', label: 'API Keys', icon: Key },
    { href: '/dashboard/usage', label: 'Usage', icon: BarChart3 },
    { href: '/dashboard/billing', label: 'Nạp gói', icon: CreditCard },
    { href: '/dashboard/plans', label: 'Gói cước', icon: Package },
    { href: '/dashboard/docs', label: 'Tài liệu', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--cream-100)]">
      <aside className="w-60 hidden md:flex flex-col border-r border-[var(--lavender-100)] bg-white dark:bg-[#1A1A19] p-4 gap-1 h-screen sticky top-0 overflow-y-auto">
        <Link href="/" className="flex items-center gap-2 px-2 py-3 mb-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand-orange)] text-white font-serif text-xs">C</span>
          <span className="heading-5 text-[15px]">Api4Cheap</span>
        </Link>
        <nav className="flex flex-col gap-0.5 flex-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] text-[var(--stone-600)] hover:bg-[var(--cream-50)] hover:text-[var(--charcoal-900)] transition-colors">
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="mt-4 flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] bg-[var(--cream-50)] text-[var(--brand-orange)] font-medium">
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="pt-4 border-t border-[var(--lavender-100)]">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="caption truncate max-w-[120px]">{user.email}</span>
            <ThemeToggle />
          </div>
          <a href="/api/auth/logout" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[var(--stone-600)] hover:bg-[var(--cream-50)] hover:text-[var(--charcoal-900)] transition-colors mt-1">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </a>
        </div>
      </aside>
      <MobileNav nav={nav.map((n) => ({ href: n.href, label: n.label }))} email={user.email} isAdmin={user.role === 'ADMIN'} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto min-h-screen">{children}</main>
    </div>
  );
}
