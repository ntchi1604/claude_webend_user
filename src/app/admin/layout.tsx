import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { Users, Package, Cpu, CreditCard, ArrowLeft, Settings, LayoutDashboard, KeyRound, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import MobileNav from '@/components/mobile-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const nav = [
    { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Người dùng', icon: Users },
    { href: '/admin/plans', label: 'Gói cước', icon: Package },
    { href: '/admin/models', label: 'Model', icon: Cpu },
    { href: '/admin/payments', label: 'Thanh toán', icon: CreditCard },
    { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
    { href: '/admin/change-password', label: 'Đổi mật khẩu', icon: KeyRound },
    { href: '/admin/setup-confirm', label: 'Thiết lập xác nhận', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen flex bg-[var(--cream-100)]">
      <aside className="w-60 hidden md:flex flex-col border-r border-[var(--lavender-100)] bg-white dark:bg-[#1A1A19] p-4 gap-1 h-screen sticky top-0 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <img src="/api4cheap-logo.svg" alt="Api4Cheap" className="h-7 w-7 rounded-md" />
          <span className="heading-5 text-[15px]">Admin</span>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] text-[var(--stone-600)] hover:bg-[var(--cream-50)] hover:text-[var(--charcoal-900)] transition-colors">
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="pt-4 border-t border-[var(--lavender-100)]">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="caption truncate max-w-[120px]">{user.email}</span>
            <ThemeToggle />
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-[14px] text-[var(--stone-600)] hover:bg-[var(--cream-50)] hover:text-[var(--charcoal-900)] transition-colors mt-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard người dùng
          </Link>
        </div>
      </aside>
      <MobileNav nav={[...nav.map((n) => ({ href: n.href, label: n.label })), { href: '/dashboard', label: '← Dashboard người dùng' }]} email={user.email} isAdmin={false} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto min-h-screen">{children}</main>
    </div>
  );
}
