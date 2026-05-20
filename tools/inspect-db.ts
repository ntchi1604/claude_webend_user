import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== MODELS ===');
  const models = await prisma.model.findMany({ orderBy: [{ provider: 'asc' }, { name: 'asc' }] });
  for (const m of models) {
    console.log(`[${m.provider}] ${m.name.padEnd(32)} -> upstream=${m.upstreamName.padEnd(34)} endpoint=${m.endpoint ?? '(use ROUTER_BASE_URL)'} enabled=${m.enabled}`);
  }

  console.log('\n=== PLANS ===');
  const plans = await prisma.plan.findMany();
  for (const p of plans) {
    const ids: string[] = JSON.parse(p.modelIds || '[]');
    const names = await prisma.model.findMany({ where: { id: { in: ids } }, select: { name: true } });
    console.log(`${p.name.padEnd(10)} tokens=${p.tokenLimit.toString().padEnd(10)} window=${p.windowHours}h enabled=${p.enabled} models=${names.map((n) => n.name).join(', ')}`);
  }

  console.log('\n=== USERS (top 10) ===');
  const users = await prisma.user.findMany({ take: 10, select: { email: true, role: true, banned: true, createdAt: true } });
  for (const u of users) console.log(`${u.email.padEnd(30)} role=${u.role} banned=${u.banned}`);
  console.log(`Total users: ${await prisma.user.count()}`);

  console.log('\n=== API KEYS (top 5, redacted) ===');
  const keys = await prisma.apiKey.findMany({ take: 5, include: { user: { select: { email: true } } } });
  for (const k of keys) console.log(`${k.keyPrefix}...  user=${k.user.email} active=${k.active} lastUsed=${k.lastUsedAt}`);

  console.log('\n=== RECENT USAGE (last 10) ===');
  const logs = await prisma.usageLog.findMany({ take: 10, orderBy: { ts: 'desc' }, include: { apiKey: { select: { keyPrefix: true } } } });
  for (const l of logs) console.log(`${l.ts.toISOString()} ${l.modelName.padEnd(32)} status=${l.status} pt=${l.promptTokens} ct=${l.completionTokens} err=${(l.errorMessage ?? '').slice(0, 120)}`);

  console.log('\n=== FAILED REQUESTS (last 10, status!=200) ===');
  const fails = await prisma.usageLog.findMany({ where: { status: { not: 200 } }, take: 10, orderBy: { ts: 'desc' } });
  for (const l of fails) console.log(`${l.ts.toISOString()} ${l.modelName.padEnd(32)} status=${l.status} err=${(l.errorMessage ?? '').slice(0, 200)}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
