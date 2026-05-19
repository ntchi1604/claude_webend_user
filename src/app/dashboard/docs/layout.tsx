'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, BookOpen } from 'lucide-react';

const DOCS = [
  { href: '/dashboard/docs', label: 'Quick Setup', icon: Zap },
  { href: '/dashboard/docs/claude-code', label: 'Claude Code', icon: BookOpen },
  { href: '/dashboard/docs/codex-cli', label: 'Codex CLI', icon: BookOpen },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid gap-6 lg:grid-cols-4 max-w-7xl">
      <aside className="lg:col-span-1">
        <div className="card p-3 lg:sticky lg:top-6">
          <p className="label px-2 pb-2">Tài liệu</p>
          <nav className="flex flex-col gap-0.5">
            {DOCS.map(d => {
              const active = pathname === d.href;
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-[14px] transition-colors ${
                    active
                      ? 'bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'text-[var(--stone-600)] hover:bg-[var(--cream-50)] hover:text-[var(--charcoal-900)]'
                  }`}
                >
                  <d.icon className="h-4 w-4" /> {d.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="lg:col-span-3 min-w-0">{children}</div>
    </div>
  );
}
