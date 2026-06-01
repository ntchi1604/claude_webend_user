import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { generateApiKey } from '@/lib/auth';
import { z } from 'zod';

export async function GET() {
  try {
    const user = await requireUser();
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, keyPrefix: true, active: true, lastUsedAt: true, createdAt: true }
    });
    return NextResponse.json({ keys });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

const schema = z.object({ name: z.string().max(64).optional() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { name } = schema.parse(body);
    const { key, prefix, hash } = generateApiKey();
    const created = await prisma.apiKey.create({
      data: { userId: user.id, name: name || null, keyHash: hash, keyPrefix: prefix }
    });
    return NextResponse.json({ key, id: created.id });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
