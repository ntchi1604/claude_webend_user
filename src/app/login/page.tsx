'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Đăng nhập thất bại'); return; }
      router.push(data.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch { setError('Lỗi kết nối'); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-orange)] text-white font-serif text-lg">C</span>
          </Link>
          <h1 className="heading-1 mt-4">Đăng nhập</h1>
          <p className="body-sm text-[var(--stone-600)] mt-1">Chào mừng trở lại</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
          <div>
            <label className="form-label">Email</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="email@example.com" required />
          </div>
          <div>
            <label className="form-label">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center body-sm text-[var(--stone-600)] mt-4">
          Chưa có tài khoản? <Link href="/register" className="link" style={{ color: 'var(--brand-blue)' }}>Đăng ký</Link>
          {' · '}
          <Link href="/forgot-password" className="link" style={{ color: 'var(--brand-blue)' }}>Quên mật khẩu?</Link>
        </p>
      </div>
    </main>
  );
}
