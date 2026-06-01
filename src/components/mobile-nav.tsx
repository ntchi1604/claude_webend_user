'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';

type NavItem = { href: string; label: string };

export default function MobileNav({ nav, email, isAdmin }: { nav: NavItem[]; email: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-white dark:bg-[#1A1A19] border border-[var(--lavender-100)]"
        style={{ boxShadow: 'var(--shadow-subtle)' }}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
          <aside
            className="w-64 h-full bg-white dark:bg-[#1A1A19] p-4 flex flex-col gap-1 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-2 py-3 mb-2">
              <img src="/api4cheap-logo.svg" alt="Api4Cheap" className="h-7 w-7 rounded-md" />
              <span className="heading-5 text-[15px] brand-text-effect">Api4Cheap</span>
            </div>
            <nav className="flex flex-col gap-0.5 flex-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] text-[var(--stone-600)] hover:bg-[var(--cream-50)] hover:text-[var(--charcoal-900)] transition-colors"
                >
                  {n.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)} className="mt-4 flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] bg-[var(--cream-50)] text-[var(--brand-orange)] font-medium">
                  Quản trị
                </Link>
              )}
            </nav>
            <div className="pt-4 border-t border-[var(--lavender-100)]">
              <span className="caption px-3 truncate block">{email}</span>
              <a href="/api/auth/logout" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-[14px] text-[var(--stone-600)] hover:bg-[var(--cream-50)] mt-1">
                <LogOut className="h-4 w-4" /> Đăng xuất
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
