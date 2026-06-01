import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

const ALLOWED_KEYS = ['bank_info'];

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.setting.findMany();
    return NextResponse.json({ settings });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: `Key không hợp lệ. Chỉ cho phép: ${ALLOWED_KEYS.join(', ')}` }, { status: 400 });
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value ?? '') },
      create: { key, value: String(value ?? '') }
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
