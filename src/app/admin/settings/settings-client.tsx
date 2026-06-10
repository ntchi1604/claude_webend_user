'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Bell, Save } from 'lucide-react';

type AnnouncementConfig = {
  enabled: boolean;
  title: string;
  message: string;
  ctaLabel: string;
  version: string;
};

export default function SettingsClient({
  initial,
  initialAnnouncement,
}: {
  initial: any;
  initialAnnouncement: AnnouncementConfig;
}) {
  const [bank, setBank] = useState(initial);
  const [announcement, setAnnouncement] = useState<AnnouncementConfig>(initialAnnouncement);

  async function saveBank() {
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'bank_info', value: JSON.stringify(bank) }),
    });
    if (r.ok) toast.success('Đã lưu'); else toast.error('Lỗi');
  }

  async function saveAnnouncement() {
    const payload: AnnouncementConfig = {
      ...announcement,
      title: announcement.title.trim(),
      message: announcement.message.trim(),
      ctaLabel: announcement.ctaLabel.trim() || 'Đã hiểu',
      version: String(Date.now()),
    };

    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'dashboard_announcement', value: JSON.stringify(payload) }),
    });

    if (!r.ok) {
      toast.error('Lỗi');
      return;
    }

    setAnnouncement(payload);
    toast.success('Đã lưu thông báo');
  }

  return (
    <div className="app-page animate-fade-in">
      <h1 className="text-3xl font-bold">Cấu hình</h1>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Thông tin ngân hàng hiển thị cho người dùng</h2>
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
        <button onClick={saveBank} className="btn-primary"><Save className="h-4 w-4" /> Lưu</button>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--brand-orange)]" />
          <h2 className="font-semibold">Thông báo popup dashboard</h2>
        </div>

        <label className="flex items-center gap-3 text-sm text-[var(--charcoal-900)]">
          <input
            type="checkbox"
            checked={announcement.enabled}
            onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
          />
          Bật popup khi người dùng vào dashboard
        </label>

        <div>
          <label className="label">Tiêu đề</label>
          <input
            className="input mt-1"
            value={announcement.title}
            onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
            placeholder="Ví dụ: Bảo trì hệ thống"
          />
        </div>

        <div>
          <label className="label">Nội dung</label>
          <textarea
            className="input mt-1 min-h-[140px]"
            value={announcement.message}
            onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
            placeholder="Nhập nội dung thông báo cho người dùng..."
          />
        </div>

        <div>
          <label className="label">Nhãn nút</label>
          <input
            className="input mt-1"
            value={announcement.ctaLabel}
            onChange={(e) => setAnnouncement({ ...announcement, ctaLabel: e.target.value })}
            placeholder="Đã hiểu"
          />
        </div>

        <p className="caption">
          Mỗi lần lưu, thông báo sẽ có phiên bản mới. Người dùng đã xem bản cũ sẽ thấy lại bản mới một lần.
        </p>

        <button onClick={saveAnnouncement} className="btn-primary"><Save className="h-4 w-4" /> Lưu thông báo</button>
      </div>
    </div>
  );
}
