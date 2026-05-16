'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, X, RefreshCw } from 'lucide-react';

type P = { id: string; userEmail: string; planName: string; amountVND: number; status: 'PENDING' | 'APPROVED' | 'REJECTED'; reference: string | null; note: string | null; createdAt: string };

export default function PaymentsClient({ payments }: { payments: P[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    const r = await fetch(`/api/admin/payments/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action })
    });
    setBusy(null);
    if (r.ok) {
      toast.success(action === 'approve' ? 'Đã duyệt' : 'Đã từ chối');
      location.reload();
    } else {
      const d = await r.json();
      toast.error(d.error || 'Lỗi');
    }
  }

  const filtered = filter === 'ALL' ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Thanh toán</h1>
        <div className="flex gap-2">
          {(['PENDING','APPROVED','REJECTED','ALL'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`btn-ghost text-xs ${filter === f ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}>{f}</button>
          ))}
          <button onClick={() => location.reload()} className="btn-ghost text-xs"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-left">
            <tr>
              <th className="p-3">Thời gian</th>
              <th className="p-3">User</th>
              <th className="p-3">Gói</th>
              <th className="p-3">Số tiền</th>
              <th className="p-3">Mã GD</th>
              <th className="p-3">Ghi chú</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-zinc-500">Trống</td></tr>}
            {filtered.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <td className="p-3 whitespace-nowrap">{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                <td className="p-3">{p.userEmail}</td>
                <td className="p-3">{p.planName}</td>
                <td className="p-3 font-medium">{p.amountVND.toLocaleString('vi-VN')}đ</td>
                <td className="p-3 font-mono text-xs">{p.reference || '—'}</td>
                <td className="p-3 text-xs text-zinc-500 max-w-xs truncate">{p.note || ''}</td>
                <td className="p-3">
                  {p.status === 'PENDING' && <span className="badge bg-amber-500/15 text-amber-700">Chờ</span>}
                  {p.status === 'APPROVED' && <span className="badge bg-emerald-500/15 text-emerald-700">Duyệt</span>}
                  {p.status === 'REJECTED' && <span className="badge bg-red-500/15 text-red-700">Từ chối</span>}
                </td>
                <td className="p-3 text-right space-x-1">
                  {p.status === 'PENDING' && (
                    <>
                      <button disabled={busy === p.id} onClick={() => act(p.id, 'approve')} className="btn-primary py-1 px-2 text-xs"><Check className="h-3.5 w-3.5" /> Duyệt</button>
                      <button disabled={busy === p.id} onClick={() => act(p.id, 'reject')} className="btn-danger py-1 px-2 text-xs"><X className="h-3.5 w-3.5" /></button>
                    </>
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
