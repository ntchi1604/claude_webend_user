'use client';
import { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SetupConfirmPage() {
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/set-admin-confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          currentPassword: loginPassword,
          adminConfirmPassword: confirmPassword,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Thất bại'); return; }
      setSuccess(data.message || 'Thành công!');
      setLoginPassword('');
      setConfirmPassword('');
    } catch { setError('Lỗi kết nối'); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="h-6 w-6 text-[var(--brand-orange)]" />
        <h1 className="heading-1">Thiết lập mật khẩu xác nhận</h1>
      </div>
      <p className="body-sm text-[var(--stone-600)] mb-6">
        Mật khẩu này dùng để xác nhận khi đổi email/mật khẩu cho bất kỳ user nào.
        <br /><strong>Khác</strong> với mật khẩu đăng nhập của bạn.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
        {success && (
          <div className="flex items-center gap-2 justify-center py-2 text-sm" style={{ color: 'var(--brand-green)' }}>
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
        <div>
          <label className="form-label">Mật khẩu đăng nhập hiện tại</label>
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="input"
            placeholder="••••••"
            required
            minLength={6}
            autoFocus
          />
        </div>
        <div>
          <label className="form-label">Mật khẩu xác nhận admin (mới)</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="Tối thiểu 6 ký tự, khác mật khẩu đăng nhập"
            required
            minLength={6}
          />
          <p className="text-xs text-[var(--stone-500)] mt-1">
            Mật khẩu này sẽ được yêu cầu khi đổi thông tin người dùng
          </p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Đang lưu...' : 'Thiết lập mật khẩu xác nhận'}
        </button>
      </form>
    </div>
  );
}
