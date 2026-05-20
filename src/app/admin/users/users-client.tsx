'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Ban, ShieldCheck, Sparkles } from 'lucide-react';

type U = { id: string; email: string; name: string | null; role: string; banned: boolean; createdAt: string; planName: string | null; expiresAt: string | null; keyCount: number; paymentCount: number; totalTokens: number };
type P = { id: string; name: string; durationDays: number };

export default function UsersClient({ users, plans }: { users: U[]; plans: P[] }) {
  const [q, setQ] = useState('');
  const [picking, setPicking] = useState<string | null>(null);
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');

  const filtered = users.filter((u) => u.email.toLowerCase().includes(q.toLowerCase()));

  async function call(id: string, action: 'ban' | 'unban' | 'grant', extra?: any) {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    if (r.ok) { toast.success('Đã cập nhật'); location.reload(); }
    else { const d = await r.json(); toast.error(d.error || 'Lỗi'); }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Người dùng</h1>
        <input className="input max-w-xs" placeholder="Tìm email..." value={q} onChange={(e) => setQ(e.target.value)} />
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
                  {u.email}
                  {u.banned && <span className="ml-2 badge bg-red-500/15 text-red-700">Đã chặn</span>}
                </td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.planName ?? '—'}</td>
                <td className="p-3 text-xs">{u.expiresAt ? new Date(u.expiresAt).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="p-3">{u.keyCount}</td>
                <td className="p-3 font-mono text-xs">{u.totalTokens.toLocaleString('vi-VN')}</td>
                <td className="p-3 text-xs">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="p-3 text-right space-x-1">
                  <button onClick={() => setPicking(picking === u.id ? null : u.id)} className="btn-ghost text-xs"><Sparkles className="h-3.5 w-3.5" /> Cấp gói</button>
                  {u.banned
                    ? <button onClick={() => call(u.id, 'unban')} className="btn-ghost text-xs"><ShieldCheck className="h-3.5 w-3.5" /></button>
                    : <button onClick={() => call(u.id, 'ban')} className="btn-danger text-xs py-1 px-2"><Ban className="h-3.5 w-3.5" /></button>}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
