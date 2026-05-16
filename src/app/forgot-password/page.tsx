'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, newPassword, newEmail: newEmail || undefined })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Thất bại'); return; }
      setSuccess('Cập nhật thành công! Bạn có thể đăng nhập với thông tin mới.');
    } catch { setError('Lỗi kết nối'); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-orange)] text-white font-serif text-lg">A</span>
          </Link>
          <h1 className="heading-1 mt-4">Đổi mật khẩu</h1>
          <p className="body-sm text-[var(--stone-600)] mt-1">Nhập email hiện tại và mật khẩu mới</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
          {success && <div className="w-full text-center py-2 text-sm" style={{ color: 'var(--brand-green)' }}>{success}</div>}
          <div>
            <label className="form-label">Email hiện tại</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="email@example.com" required />
          </div>
          <div>
            <label className="form-label">Email mới (tuỳ chọn)</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="input" placeholder="newemail@example.com" />
          </div>
          <div>
            <label className="form-label">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" placeholder="Tối thiểu 6 ký tự" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Đang xử lý...' : 'Cập nhật'}
          </button>
        </form>

        <p className="text-center body-sm text-[var(--stone-600)] mt-4">
          <Link href="/login" className="link" style={{ color: 'var(--brand-blue)' }}>← Quay lại đăng nhập</Link>
        </p>
      </div>
    </main>
  );
}
