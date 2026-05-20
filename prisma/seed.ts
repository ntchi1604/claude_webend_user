import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ANTHROPIC_MODELS = [
  { name: 'claude-opus-4-7', upstreamName: 'claude/claude-opus-4-7', inputPriceVND: 90000, outputPriceVND: 450000 },
  { name: 'claude-sonnet-4-6', upstreamName: 'claude/claude-sonnet-4-6', inputPriceVND: 75000, outputPriceVND: 375000 },
  { name: 'claude-haiku-4-5', upstreamName: 'claude/claude-haiku-4-5-20251001', inputPriceVND: 25000, outputPriceVND: 125000 }
];

const LEGACY_DISABLED_NAMES = ['claude-opus-4-6', 'claude-sonnet-4-5', 'claude-haiku-4'];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: hash, role: 'ADMIN', name: 'Admin' }
  });
  console.log('Admin:', admin.email);

  for (const m of ANTHROPIC_MODELS) {
    const updated = await prisma.model.upsert({
      where: { name: m.name },
      update: { upstreamName: m.upstreamName, provider: 'anthropic', enabled: true },
      create: { ...m, provider: 'anthropic' }
    });
    console.log(`Model upsert: ${updated.name} -> ${updated.upstreamName}`);
  }

  const disabled = await prisma.model.updateMany({
    where: { name: { in: LEGACY_DISABLED_NAMES } },
    data: { enabled: false }
  });
  console.log(`Disabled legacy models: ${disabled.count}`);

  const disabledRows = await prisma.model.findMany({
    where: { name: { in: LEGACY_DISABLED_NAMES } },
    select: { id: true }
  });
  const disabledIds = new Set(disabledRows.map((r) => r.id));

  const plans = await prisma.plan.findMany();
  for (const p of plans) {
    const ids: string[] = JSON.parse(p.modelIds || '[]');
    const cleaned = ids.filter((id) => !disabledIds.has(id));
    if (cleaned.length !== ids.length) {
      await prisma.plan.update({ where: { id: p.id }, data: { modelIds: JSON.stringify(cleaned) } });
      console.log(`Plan "${p.name}": removed ${ids.length - cleaned.length} disabled model(s)`);
    }
  }

  await prisma.setting.upsert({
    where: { key: 'bank_info' },
    update: {},
    create: {
      key: 'bank_info',
      value: JSON.stringify({ bankName: 'Vietcombank', accountNumber: '0123456789', accountName: 'NGUYEN VAN A', note: 'Ghi rõ email khi chuyển khoản' })
    }
  });

  console.log('Seed done.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
