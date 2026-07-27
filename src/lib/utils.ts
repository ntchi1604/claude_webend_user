import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(n: number | bigint) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('vi-VN');
}

export function timeUntil(d: Date | string | null) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return 'now';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
