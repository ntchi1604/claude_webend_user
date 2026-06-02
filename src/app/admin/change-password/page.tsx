'use client';
import { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, CheckCircle2 } from 'lucide-react';

export default function AdminChangePasswordPage() {
  const [step, setStep] = useState<'verify' | 'change'>('verify');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ step: 'verify', adminConfirmPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Xác nhận thất bại'); return; }
      setStep('change');
    } catch { setError('Lỗi kết nối'); } finally { setLoading(false); }
  }

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const r = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          step: 'change',
          adminConfirmPassword,
          targetEmail,
          newPassword,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Thất bại'); return; }
      setSuccess(data.message || 'Thành công!');
      setTargetEmail('');
      setNewPassword('');
    } catch { setError('Lỗi kết nối'); } finally { setLoading(false); }
  }

  // Step 1: Verify admin password
  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-[var(--brand-orange)]" />
          <h1 className="heading-1">Đổi mật khẩu người dùng</h1>
        </div>
        <p className="body-sm text-[var(--stone-600)] mb-6">
          Nhập mật khẩu xác nhận admin để tiếp tục
        </p>

        <form onSubmit={handleVerify} className="card space-y-4">
          {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
          <div>
            <label className="form-label flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Mật khẩu xác nhận admin
            </label>
            <input
              type="password"
              value={adminConfirmPassword}
              onChange={(e) => setAdminConfirmPassword(e.target.value)}
              className="input"
              placeholder="Nhập mật khẩu xác nhận..."
              required
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Đang xác nhận...' : 'Xác nhận'}
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Change password form
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <KeyRound className="h-6 w-6 text-[var(--brand-green)]" />
        <h1 className="heading-1">Đặt mật khẩu mới</h1>
      </div>
      <p className="body-sm text-[var(--stone-600)] mb-6">
        Nhập email người dùng và mật khẩu mới
      </p>

      <form onSubmit={handleChange} className="card space-y-4">
        {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
        {success && (
          <div className="flex items-center gap-2 justify-center py-2 text-sm" style={{ color: 'var(--brand-green)' }}>
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
        <div>
          <label className="form-label flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> Email người dùng
          </label>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            className="input"
            placeholder="user@example.com"
            required
            autoFocus
          />
          <p className="text-xs text-[var(--stone-500)] mt-1">
            Có thể đổi mật khẩu cho chính admin hoặc bất kỳ user nào
          </p>
        </div>
        <div>
          <label className="form-label flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> Mật khẩu mới
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
            placeholder="Tối thiểu 6 ký tự"
            required
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Đang đổi...' : 'Đặt mật khẩu mới'}
        </button>
      </form>
    </div>
  );
}
