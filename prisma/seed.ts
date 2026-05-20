import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', password: hash },
    create: { email: adminEmail, password: hash, role: 'ADMIN', name: 'Admin' }
  });
  console.log('Admin:', admin.email);

  const sonnet = await prisma.model.upsert({
    where: { name: 'claude-sonnet-4-5' },
    update: {},
    create: { name: 'claude-sonnet-4-5', upstreamName: 'claude-sonnet-4-5', provider: 'anthropic', inputPriceVND: 75000, outputPriceVND: 375000 }
  });
  const haiku = await prisma.model.upsert({
    where: { name: 'claude-haiku-4' },
    update: {},
    create: { name: 'claude-haiku-4', upstreamName: 'claude-haiku-4', provider: 'anthropic', inputPriceVND: 20000, outputPriceVND: 100000 }
  });
  const gpt4 = await prisma.model.upsert({
    where: { name: 'gpt-4o' },
    update: {},
    create: { name: 'gpt-4o', upstreamName: 'gpt-4o', provider: 'openai', inputPriceVND: 60000, outputPriceVND: 240000 }
  });
  const gpt4mini = await prisma.model.upsert({
    where: { name: 'gpt-4o-mini' },
    update: {},
    create: { name: 'gpt-4o-mini', upstreamName: 'gpt-4o-mini', provider: 'openai', inputPriceVND: 4000, outputPriceVND: 16000 }
  });

  await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: { name: 'Free', description: 'Dùng thử', tokenLimit: 50_000, windowHours: 5, durationDays: 30, priceVND: 0, modelIds: JSON.stringify([gpt4mini.id]) }
  });
  await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: {},
    create: { name: 'Basic', description: 'Cơ bản, reset mỗi 5 giờ', tokenLimit: 500_000, windowHours: 5, durationDays: 30, priceVND: 99_000, modelIds: JSON.stringify([gpt4mini.id, gpt4.id, haiku.id]) }
  });
  await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: { name: 'Pro', description: 'Chuyên nghiệp', tokenLimit: 2_000_000, windowHours: 5, durationDays: 30, priceVND: 299_000, modelIds: JSON.stringify([gpt4mini.id, gpt4.id, haiku.id, sonnet.id]) }
  });
  await prisma.plan.upsert({
    where: { name: 'Max' },
    update: {},
    create: { name: 'Max', description: 'Tối đa', tokenLimit: 10_000_000, windowHours: 5, durationDays: 30, priceVND: 799_000, modelIds: JSON.stringify([gpt4mini.id, gpt4.id, haiku.id, sonnet.id]) }
  });

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

main().finally(() => prisma.$disconnect());
