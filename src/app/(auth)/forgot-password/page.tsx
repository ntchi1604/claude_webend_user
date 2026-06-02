'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Try to check if user is logged in by hitting a lightweight endpoint
    fetch('/api/models', { credentials: 'include' })
      .then((r) => {
        if (r.ok) router.replace('/dashboard/settings');
      })
      .catch(() => {});
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <img src="/api4cheap-logo.svg" alt="Api4Cheap" className="h-10 w-10 rounded-md mx-auto mb-4" />
        <h1 className="heading-1 mb-2">Đổi thông tin</h1>
        <p className="body-sm text-[var(--stone-600)] mb-6">
          Bạn cần đăng nhập để đổi thông tin tài khoản.
        </p>
        <a href="/login" className="btn-primary inline-block">Đăng nhập</a>
      </div>
    </main>
  );
}
