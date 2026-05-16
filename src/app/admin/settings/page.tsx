import { prisma } from '@/lib/prisma';
import SettingsClient from './settings-client';

export default async function AdminSettingsPage() {
  const bank = await prisma.setting.findUnique({ where: { key: 'bank_info' } });
  const parsed = bank ? JSON.parse(bank.value) : { bankName: '', accountNumber: '', accountName: '', note: '' };
  return <SettingsClient initial={parsed} />;
}
