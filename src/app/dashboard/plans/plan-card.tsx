'use client';
import Link from 'next/link';
import { Check } from 'lucide-react';

type Props = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  tokenLimit: string;
  windowHours: number;
  durationDays: number;
  models: string[];
  current: boolean;
  expiresAt?: string | null;
};

function formatRemainingTime(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Đã hết hạn';
  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `còn ${hours} giờ ${minutes} phút`;
  return `còn ${minutes} phút`;
}

export default function PlanCard({ id, name, description, price, tokenLimit, windowHours, durationDays, models, current, expiresAt }: Props) {
  const isHighlight = name === 'Pro';
  const remaining = current ? formatRemainingTime(expiresAt) : null;

  return (
    <div className={`card relative ${isHighlight ? 'border-[var(--brand-orange)] shadow-elevated' : ''}`}>
      {current && <span className="badge-success absolute -top-3 left-4">Đang dùng</span>}
      {isHighlight && !current && <span className="badge-primary absolute -top-3 left-1/2 -translate-x-1/2">Phổ biến</span>}

      <h3 className="heading-5">{name}</h3>
      {description && <p className="caption mt-1">{description}</p>}

      <div className="mt-4">
        <span className="display-md">{price}</span>
        <span className="body-sm text-[var(--stone-600)]"> / {durationDays} ngày</span>
      </div>

      {remaining && (
        <div className="mt-3 caption" style={{ color: 'var(--stone-600)' }}>
          Thời gian còn lại: {remaining}
        </div>
      )}

      <ul className="mt-4 space-y-2">
        <li className="flex items-center gap-2 body-sm">
          <Check className="h-4 w-4" style={{ color: 'var(--accent-green)' }} />
          {tokenLimit} token / {windowHours}h
        </li>
        <li className="flex items-center gap-2 body-sm">
          <Check className="h-4 w-4" style={{ color: 'var(--accent-green)' }} />
          Reset cuốn chiếu
        </li>
        {models.map((m) => (
          <li key={m} className="flex items-center gap-2 body-sm">
            <Check className="h-4 w-4" style={{ color: 'var(--accent-green)' }} />
            {m}
          </li>
        ))}
      </ul>

      {current ? (
        <button disabled className="btn-secondary w-full mt-6 opacity-60">Gia hạn</button>
      ) : (
        <Link href={`/dashboard/billing?plan=${id}`} className={`w-full mt-6 ${isHighlight ? 'btn-cta' : 'btn-primary'}`}>
          Chọn gói
        </Link>
      )}
    </div>
  );
}