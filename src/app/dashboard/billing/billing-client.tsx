'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, CheckCircle2, Clock, XCircle } from 'lucide-react';

type Plan = { id: string; name: string; priceVND: number; tokenLimit: number; durationDays: number; windowHours: number };
type Pay = { id: string; planName: string; amountVND: number; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string; reference: string | null };

export default function BillingClient({
  plans, bank, payments, selectedPlanId, userEmail
}: {
  plans: Plan[];
  bank: any;
  payments: Pay[];
  selectedPlanId?: string;
  userEmail: string;
}) {
  const [planId, setPlanId] = useState(selectedPlanId || plans.find((p) => p.priceVND > 0)?.id || plans[0]?.id);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const plan = plans.find((p) => p.id === planId);

  const transferNote = `${userEmail} ${plan?.name ?? ''}`.trim();
  const qrUrl =
    bank && plan
      ? `https://img.vietqr.io/image/${encodeURIComponent(bank.bankName)}-${encodeURIComponent(bank.accountNumber)}-compact2.png?amount=${plan.priceVND}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(bank.accountName)}`
      : null;

  async function submit() {
    if (!plan) return;
    setLoading(true);
    const r = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId: plan.id, reference, note })
    });
    setLoading(false);
    const d = await r.json();
    if (!r.ok) return toast.error(d.error || 'Lỗi');
    toast.success('Đã gửi yêu cầu — chờ admin duyệt');
    setReference('');
    setNote('');
    location.reload();
  }

  function copy(s: string) {
    navigator.clipboard.writeText(s).then(() => {
      toast.success('Đã copy');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = s;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); toast.success('Đã copy'); } catch { toast.error('Không thể copy'); }
      document.body.removeChild(textarea);
    });
  }

  return (
    <div className="app-page animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Nạp / Mua gói</h1>
        <p className="text-zinc-500">Chuyển khoản ngân hàng. Admin sẽ duyệt thủ công.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Chọn gói</label>
            <select id="select-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className="input mt-1">
              {plans.filter((p) => p.priceVND > 0).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.priceVND.toLocaleString('vi-VN')}đ / {p.durationDays} ngày</option>
              ))}
            </select>
          </div>

          {bank ? (
            <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">Ngân hàng</div>
                <div className="font-medium">{bank.bankName}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">Số tài khoản</div>
                <div className="flex items-center gap-2"><span className="font-mono font-medium">{bank.accountNumber}</span><button onClick={() => copy(bank.accountNumber)} className="btn-ghost p-1"><Copy className="h-3.5 w-3.5" /></button></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">Chủ TK</div>
                <div className="font-medium">{bank.accountName}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">Số tiền</div>
                <div className="font-bold text-brand-600">{plan?.priceVND.toLocaleString('vi-VN')}đ</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">Nội dung</div>
                <div className="flex items-center gap-2"><span className="font-mono text-sm">{transferNote}</span><button onClick={() => copy(transferNote)} className="btn-ghost p-1"><Copy className="h-3.5 w-3.5" /></button></div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-amber-600">Admin chưa cấu hình tài khoản ngân hàng.</div>
          )}

          <div>
            <label className="label">Mã giao dịch (sau khi chuyển khoản)</label>
            <input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} className="input mt-1" placeholder="VD: FT24123456" />
          </div>
          <div>
            <label className="label">Ghi chú (tuỳ chọn)</label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="input mt-1" rows={2} />
          </div>
          <button id="btn-submit-payment" disabled={loading} onClick={submit} className="btn-primary w-full">
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu duyệt'}
          </button>
        </div>

        <div className="card p-6 flex flex-col items-center justify-center">
          {qrUrl ? (
            <>
              <h3 className="font-semibold mb-2">VietQR — quét để chuyển khoản</h3>
              <img src={qrUrl} alt="QR" className="max-w-full rounded-lg border" />
              <p className="mt-3 text-sm text-zinc-500 text-center">Quét bằng app ngân hàng. Sau khi chuyển, nhập mã GD bên trái và gửi duyệt.</p>
            </>
          ) : (
            <div className="text-zinc-500 text-sm">Chưa có thông tin ngân hàng.</div>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold p-4">Lịch sử thanh toán</h3>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-left">
            <tr>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Gói</th>
              <th className="p-3">Số tiền</th>
              <th className="p-3">Mã GD</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-zinc-500">Chưa có giao dịch</td></tr>}
            {payments.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <td className="p-3">{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                <td className="p-3">{p.planName}</td>
                <td className="p-3 font-medium">{p.amountVND.toLocaleString('vi-VN')}đ</td>
                <td className="p-3 font-mono text-xs">{p.reference || '—'}</td>
                <td className="p-3">
                  {p.status === 'APPROVED' && <span className="badge bg-emerald-500/15 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Duyệt</span>}
                  {p.status === 'PENDING' && <span className="badge bg-amber-500/15 text-amber-700"><Clock className="h-3 w-3" /> Chờ</span>}
                  {p.status === 'REJECTED' && <span className="badge bg-red-500/15 text-red-700"><XCircle className="h-3 w-3" /> Từ chối</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
