'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function SettingsClient({ initial }: { initial: any }) {
  const [bank, setBank] = useState(initial);

  async function save() {
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'bank_info', value: JSON.stringify(bank) })
    });
    if (r.ok) toast.success('Đã lưu'); else toast.error('Lỗi');
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-3xl font-bold">Cấu hình</h1>
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Thông tin ngân hàng (hiển thị cho người dùng)</h2>
        <div>
          <label className="label">Tên ngân hàng</label>
          <input className="input mt-1" value={bank.bankName ?? ''} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} placeholder="VD: Vietcombank" />
        </div>
        <div>
          <label className="label">Số tài khoản</label>
          <input className="input mt-1" value={bank.accountNumber ?? ''} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} />
        </div>
        <div>
          <label className="label">Chủ tài khoản</label>
          <input className="input mt-1" value={bank.accountName ?? ''} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} />
        </div>
        <div>
          <label className="label">Ghi chú</label>
          <input className="input mt-1" value={bank.note ?? ''} onChange={(e) => setBank({ ...bank, note: e.target.value })} />
        </div>
        <button onClick={save} className="btn-primary"><Save className="h-4 w-4" /> Lưu</button>
      </div>
      <div className="card p-5">
        <h2 className="font-semibold mb-2">9router</h2>
        <p className="text-sm text-zinc-500">Cấu hình endpoint mặc định trong <code>.env</code>: <code>ROUTER_BASE_URL</code> và <code>ROUTER_API_KEY</code>. Mỗi model có thể ghi đè endpoint riêng.</p>
      </div>
    </div>
  );
}
