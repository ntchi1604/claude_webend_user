'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

type AnnouncementConfig = {
  enabled?: boolean;
  title?: string;
  message?: string;
  ctaLabel?: string;
  version?: string;
};

const DEFAULT_TITLE = 'Thông báo';
const DEFAULT_CTA = 'Đã hiểu';

export default function AnnouncementPopup({ config }: { config: AnnouncementConfig | null }) {
  const [open, setOpen] = useState(false);

  const normalized = useMemo(() => {
    if (!config?.enabled) return null;
    const title = config.title?.trim() || DEFAULT_TITLE;
    const message = config.message?.trim() || '';
    if (!message) return null;
    return {
      title,
      message,
      ctaLabel: config.ctaLabel?.trim() || DEFAULT_CTA,
      version: config.version || 'default',
    };
  }, [config]);

  useEffect(() => {
    if (!normalized) return;
    const key = `dashboard_announcement_seen:${normalized.version}`;
    const seen = window.localStorage.getItem(key);
    if (!seen) setOpen(true);
  }, [normalized]);

  if (!normalized || !open) return null;

  const announcementVersion = normalized.version;

  function close() {
    window.localStorage.setItem(`dashboard_announcement_seen:${announcementVersion}`, '1');
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--lavender-100)] bg-white p-6 shadow-[var(--shadow-elevated)] dark:border-[#30302E] dark:bg-[#1A1A19]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="caption text-[var(--brand-orange)]">Thông báo từ quản trị viên</p>
            <h2 className="heading-5 mt-1">{normalized.title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-2 text-[var(--stone-600)] transition hover:bg-black/5 hover:text-[var(--charcoal-900)] dark:hover:bg-white/10"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[var(--stone-600)]">
          {normalized.message}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={close} className="btn-primary">
            {normalized.ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
