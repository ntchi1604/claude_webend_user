import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fails = await prisma.usageLog.findMany({
    where: { status: { not: 200 } },
    take: 5,
    orderBy: { ts: 'desc' }
  });
  for (const l of fails) {
    console.log('\n========================================');
    console.log(`time=${l.ts.toISOString()}  model=${l.modelName}  status=${l.status}  pt=${l.promptTokens}`);
    console.log('--- errorMessage (full) ---');
    console.log(l.errorMessage ?? '(null)');
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
