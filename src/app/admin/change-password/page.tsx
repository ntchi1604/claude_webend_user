'use client';
import { useState } from 'react';
import { KeyRound, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function AdminChangePasswordPage() {
  const [targetEmail, setTargetEmail] = useState('');
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
      const r = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetEmail, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Thất bại'); return; }
      setSuccess(data.message || 'Thành công!');
      setTargetEmail('');
      setNewPassword('');
    } catch { setError('Lỗi kết nối'); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <KeyRound className="h-6 w-6 text-[var(--brand-orange)]" />
        <h1 className="heading-1">Đổi mật khẩu người dùng</h1>
      </div>
      <p className="body-sm text-[var(--stone-600)] mb-6">
        Nhập email người dùng và mật khẩu mới
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
        {success && (
          <div className="flex items-center gap-2 justify-center py-2 text-sm" style={{ color: 'var(--brand-green)' }}>
            <CheckCircle2 className="h-4 w-4" /> {success}
          </div>
        )}
        <div>
          <label className="form-label flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> Email người dùng
          </label>
          <input type="email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="input" placeholder="user@example.com" required autoFocus />
        </div>
        <div>
          <label className="form-label flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> Mật khẩu mới
          </label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" placeholder="Tối thiểu 6 ký tự" required minLength={6} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Đang đổi...' : 'Đặt mật khẩu mới'}
        </button>
      </form>
    </div>
  );
}
