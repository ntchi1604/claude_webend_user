'use client';
import { useState } from 'react';
import { Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Email change
  const [emailPassword, setEmailPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwLoading(true);
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', currentPassword, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setPwError(data.error || 'Thất bại'); return; }
      setPwSuccess(data.message || 'Thành công!');
      setCurrentPassword('');
      setNewPassword('');
    } catch { setPwError('Lỗi kết nối'); } finally { setPwLoading(false); }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setEmailLoading(true);
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'change-email', currentPassword: emailPassword, newEmail }),
      });
      const data = await r.json();
      if (!r.ok) { setEmailError(data.error || 'Thất bại'); return; }
      setEmailSuccess(data.message || 'Thành công!');
      setEmailPassword('');
      setNewEmail('');
    } catch { setEmailError('Lỗi kết nối'); } finally { setEmailLoading(false); }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="heading-1 mb-6">Đổi thông tin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột trái: Đổi email */}
        <form onSubmit={handleEmailChange} className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-[var(--brand-orange)]" />
            <h2 className="font-semibold text-[15px]">Đổi email</h2>
          </div>

          {emailError && <div className="badge-error w-full justify-center py-2">{emailError}</div>}
          {emailSuccess && (
            <div className="flex items-center gap-2 justify-center py-2 text-sm" style={{ color: 'var(--brand-green)' }}>
              <CheckCircle2 className="h-4 w-4" /> {emailSuccess}
            </div>
          )}

          <div>
            <label className="form-label">Mật khẩu hiện tại</label>
            <input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className="input" placeholder="••••••" required minLength={6} />
          </div>
          <div>
            <label className="form-label">Email mới</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="input" placeholder="email-moi@example.com" required />
          </div>
          <button type="submit" disabled={emailLoading} className="btn-primary w-full">
            {emailLoading ? 'Đang đổi...' : 'Đổi email'}
          </button>
        </form>

        {/* Cột phải: Đổi mật khẩu */}
        <form onSubmit={handlePasswordChange} className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-[var(--brand-blue)]" />
            <h2 className="font-semibold text-[15px]">Đổi mật khẩu</h2>
          </div>

          {pwError && <div className="badge-error w-full justify-center py-2">{pwError}</div>}
          {pwSuccess && (
            <div className="flex items-center gap-2 justify-center py-2 text-sm" style={{ color: 'var(--brand-green)' }}>
              <CheckCircle2 className="h-4 w-4" /> {pwSuccess}
            </div>
          )}

          <div>
            <label className="form-label">Mật khẩu hiện tại</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" placeholder="••••••" required minLength={6} />
          </div>
          <div>
            <label className="form-label">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" placeholder="Tối thiểu 6 ký tự" required minLength={6} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary w-full">
            {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
