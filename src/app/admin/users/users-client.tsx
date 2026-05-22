'use client';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Ban, Minus, Plus, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

type U = { id: string; email: string; name: string | null; role: string; banned: boolean; createdAt: string; planName: string | null; expiresAt: string | null; keyCount: number; paymentCount: number; totalTokens: number };
type P = { id: string; name: string; durationDays: number };
type SortKey = 'createdAt' | 'email' | 'planName' | 'totalTokens' | 'keyCount';

export default function UsersClient({ users, plans }: { users: U[]; plans: P[] }) {
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [picking, setPicking] = useState<string | null>(null);
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  const [resetting, setResetting] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users
      .filter((u) => !query || u.email.toLowerCase().includes(query) || (u.name ?? '').toLowerCase().includes(query))
      .filter((u) => planFilter === 'all' || (planFilter === 'none' ? !u.planName : u.planName === planFilter))
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortKey === 'createdAt') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        if (sortKey === 'totalTokens') return (a.totalTokens - b.totalTokens) * dir;
        if (sortKey === 'keyCount') return (a.keyCount - b.keyCount) * dir;
        return String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), 'vi') * dir;
      });
  }, [users, q, planFilter, sortKey, sortDir]);

  const planNames = useMemo(() => Array.from(new Set(users.map((u) => u.planName).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'vi')), [users]);

  async function call(id: string, action: 'ban' | 'unban' | 'grant' | 'extend', extra?: any) {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    if (r.ok) { toast.success('Đã cập nhật'); location.reload(); }
    else { const d = await r.json(); toast.error(d.error || 'Lỗi'); }
  }

  async function adjustDays(id: string, sign: 1 | -1) {
    const raw = extendDays[id] ?? 1;
    const days = Math.abs(Number(raw));
    if (!Number.isFinite(days) || days <= 0) return toast.error('Nhập số ngày hợp lệ');
    await call(id, 'extend', { days: sign * days });
  }
  async function resetQuota(id: string) {
    if (!confirm('Reset token/quota của user này về 0?')) return;
    setResetting(id);
    const r = await fetch(`/api/admin/users/${id}/quota`, { method: 'POST' });
    setResetting(null);
    if (r.ok) { toast.success('Đã reset token về 0'); location.reload(); }
    else { const d = await r.json(); toast.error(d.error || 'Lỗi'); }
  }

  return (
    <div className="app-page animate-fade-in">
      <div className="app-page-header">
        <div>
          <p className="dashboard-eyebrow">Admin</p>
          <h1 className="text-3xl font-bold">Người dùng</h1>
          <p className="body-sm text-[var(--stone-600)] mt-1">Lọc theo gói, sắp xếp user, cấp gói, reset quota, cộng trừ ngày gia hạn từng tài khoản.</p>
        </div>
        <div className="app-header-stat">{filtered.length} / {users.length} user</div>
      </div>

      <div className="admin-users-toolbar card">
        <input className="input" placeholder="Tìm email hoặc tên..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
          <option value="all">Tất cả gói</option>
          <option value="none">Chưa có gói</option>
          {planNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select className="input" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="createdAt">Sắp xếp: ngày đăng ký</option>
          <option value="email">Sắp xếp: email</option>
          <option value="planName">Sắp xếp: gói</option>
          <option value="totalTokens">Sắp xếp: token</option>
          <option value="keyCount">Sắp xếp: số key</option>
        </select>
        <button className="btn-secondary admin-users-sort-dir" onClick={() => setSortDir((v) => v === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'}</button>
      </div>

      <div className="caption" style={{ marginBottom: '8px', color: 'var(--stone-600)' }}>
        Gia hạn = cộng/trừ ngày vào hạn hiện tại. Nhập số ngày, sau đó chọn Cộng ngày hoặc Trừ ngày.
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-left">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Vai trò</th>
              <th className="p-3">Gói</th>
              <th className="p-3">Hết hạn</th>
              <th className="p-3">Key</th>
              <th className="p-3">Token</th>
              <th className="p-3">Đăng ký</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <td className="p-3">
                  <div className="font-medium">{u.email}</div>
                  {u.name && <div className="caption">{u.name}</div>}
                  {u.banned && <span className="mt-1 badge bg-red-500/15 text-red-700">Đã chặn</span>}
                </td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.planName ?? '-'}</td>
                <td className="p-3 text-xs">{u.expiresAt ? new Date(u.expiresAt).toLocaleDateString('vi-VN') : '-'}</td>
                <td className="p-3">{u.keyCount}</td>
                <td className="p-3 font-mono text-xs">{u.totalTokens.toLocaleString('vi-VN')}</td>
                <td className="p-3 text-xs">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="p-3 text-right">
                  <div className="admin-users-actions">
                    <button onClick={() => setPicking(picking === u.id ? null : u.id)} className="btn-ghost text-xs"><Sparkles className="h-3.5 w-3.5" /> Cấp gói</button>
                    <button onClick={() => resetQuota(u.id)} disabled={resetting === u.id} className="btn-ghost text-xs"><RotateCcw className="h-3.5 w-3.5" /> Reset token</button>
                    {u.banned
                      ? <button onClick={() => call(u.id, 'unban')} className="btn-ghost text-xs" title="Mở chặn user"><ShieldCheck className="h-3.5 w-3.5" /></button>
                      : <button onClick={() => call(u.id, 'ban')} className="btn-danger text-xs py-1 px-2" title="Chặn user"><Ban className="h-3.5 w-3.5" /></button>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 justify-end items-end">
                    <label className="flex flex-col items-end gap-1">
                      <span className="caption" style={{ fontWeight: 700 }}>Số ngày gia hạn</span>
                      <input
                        type="number"
                        min={1}
                        className="input max-w-[110px]"
                        value={extendDays[u.id] ?? 1}
                        onChange={(e) => setExtendDays({ ...extendDays, [u.id]: +e.target.value })}
                        title="Nhập số ngày để cộng hoặc trừ"
                      />
                    </label>
                    <button onClick={() => adjustDays(u.id, 1)} className="btn-secondary text-xs" title="Cộng ngày vào hạn hiện tại"><Plus className="h-3.5 w-3.5" /> Cộng ngày</button>
                    <button onClick={() => adjustDays(u.id, -1)} className="btn-ghost text-xs" title="Trừ ngày khỏi hạn hiện tại"><Minus className="h-3.5 w-3.5" /> Trừ ngày</button>
                  </div>
                  {picking === u.id && (
                    <div className="mt-2 flex gap-2 justify-end">
                      <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="input max-w-[160px]">
                        {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={() => call(u.id, 'grant', { planId })} className="btn-primary text-xs">Cấp</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-zinc-500">Không có user phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}