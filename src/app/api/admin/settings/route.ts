import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value ?? '') },
      create: { key, value: String(value ?? '') }
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
