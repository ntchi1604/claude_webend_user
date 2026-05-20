'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Đăng ký thất bại'); return; }
      router.push('/dashboard');
    } catch { setError('Lỗi kết nối'); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/api4cheap-logo.svg" alt="Api4Cheap" className="h-10 w-10 rounded-md" />
          </Link>
          <h1 className="heading-1 mt-4">Tạo tài khoản</h1>
          <p className="body-sm text-[var(--stone-600)] mt-1">Bắt đầu miễn phí với 50K tokens/5h</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
          <div>
            <label className="form-label">Tên (tuỳ chọn)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="form-label">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Tối thiểu 6 ký tự" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-cta w-full">
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="text-center body-sm text-[var(--stone-600)] mt-4">
          Đã có tài khoản? <Link href="/login" className="link" style={{ color: 'var(--brand-blue)' }}>Đăng nhập</Link>
        </p>
      </div>
    </main>
  );
}
