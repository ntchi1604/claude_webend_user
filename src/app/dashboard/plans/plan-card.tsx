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
};

export default function PlanCard({ id, name, description, price, tokenLimit, windowHours, durationDays, models, current }: Props) {
  const isHighlight = name === 'Pro';

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
