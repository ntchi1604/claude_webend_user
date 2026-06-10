import { prisma } from '@/lib/prisma';
import SettingsClient from './settings-client';

export default async function AdminSettingsPage() {
  const bank = await prisma.setting.findUnique({ where: { key: 'bank_info' } });
  const announcement = await prisma.setting.findUnique({ where: { key: 'dashboard_announcement' } });
  const parsed = bank ? JSON.parse(bank.value) : { bankName: '', accountNumber: '', accountName: '', note: '' };
  const parsedAnnouncement = announcement
    ? JSON.parse(announcement.value)
    : { enabled: false, title: '', message: '', ctaLabel: 'Đã hiểu', version: '' };
  return <SettingsClient initial={parsed} initialAnnouncement={parsedAnnouncement} />;
}
