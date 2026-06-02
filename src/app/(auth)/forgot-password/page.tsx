'use client';
import { useState } from 'react';
import Link from 'next/link';

type Tab = 'password' | 'email';

export default function ForgotPasswordPage() {
  const [tab, setTab] = useState<Tab>('password');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Email change fields
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Common
  const [adminConfirm, setAdminConfirm] = useState('');

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setCurrentEmail('');
    setNewEmail('');
    setAdminConfirm('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let body: any;

      if (tab === 'password') {
        body = {
          action: 'change-password',
          currentPassword,
          newPassword,
          adminConfirmPassword: adminConfirm,
        };
      } else {
        body = {
          action: 'change-email',
          currentEmail,
          newEmail,
          adminConfirmPassword: adminConfirm,
        };
      }

      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Thất bại');
        return;
      }
      setSuccess(data.message || 'Thành công!');
      resetForm();
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--cream-100)]">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/api4cheap-logo.svg" alt="Api4Cheap" className="h-10 w-10 rounded-md" />
          </Link>
          <h1 className="heading-1 mt-4">Đổi thông tin</h1>
          <p className="body-sm text-[var(--stone-600)] mt-1">
            Cần mật khẩu xác nhận admin để thực hiện thay đổi
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex mb-4 rounded-lg overflow-hidden border border-[var(--stone-200)]">
          <button
            type="button"
            onClick={() => { setTab('password'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'password'
                ? 'bg-[var(--brand-blue)] text-white'
                : 'bg-white text-[var(--stone-600)] hover:bg-[var(--stone-50)]'
            }`}
          >
            Đổi mật khẩu
          </button>
          <button
            type="button"
            onClick={() => { setTab('email'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'email'
                ? 'bg-[var(--brand-blue)] text-white'
                : 'bg-white text-[var(--stone-600)] hover:bg-[var(--stone-50)]'
            }`}
          >
            Đổi email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="badge-error w-full justify-center py-2">{error}</div>}
          {success && (
            <div className="w-full text-center py-2 text-sm" style={{ color: 'var(--brand-green)' }}>
              {success}
            </div>
          )}

          {tab === 'password' ? (
            <>
              <div>
                <label className="form-label">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                  placeholder="••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="form-label">Mật khẩu mới</label>
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
            </>
          ) : (
            <>
              <div>
                <label className="form-label">Email hiện tại</label>
                <input
                  type="email"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  className="input"
                  placeholder="email-hien-tai@example.com"
                  required
                />
              </div>
              <div>
                <label className="form-label">Email mới</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input"
                  placeholder="email-moi@example.com"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="form-label">Mật khẩu xác nhận admin</label>
            <input
              type="password"
              value={adminConfirm}
              onChange={(e) => setAdminConfirm(e.target.value)}
              className="input"
              placeholder="Mật khẩu xác nhận từ quản trị viên"
              required
              minLength={1}
            />
            <p className="text-xs text-[var(--stone-500)] mt-1">
              Liên hệ quản trị viên để nhận mật khẩu xác nhận
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Đang xử lý...' : tab === 'password' ? 'Đổi mật khẩu' : 'Đổi email'}
          </button>
        </form>

        <p className="text-center body-sm text-[var(--stone-600)] mt-4">
          <Link href="/login" className="link" style={{ color: 'var(--brand-blue)' }}>
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
