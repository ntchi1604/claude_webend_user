const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function update(file) {
  const abs = path.resolve(file).replace(/\\/g, '/');
  const url = 'file:' + abs;
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const r = await p.user.updateMany({ where: { email: 'admin@local' }, data: { email: 'admin@local.dev' } });
    const rows = await p.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
    console.log(file, 'updated:', r.count, '->', JSON.stringify(rows));
  } catch (e) {
    console.log(file, 'err:', e.message);
  } finally {
    await p.$disconnect();
  }
}

(async () => {
  await update('prisma/dev.db');
  await update('prisma/prod.db');
})();
