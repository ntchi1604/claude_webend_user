import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

function normalizeFallbackEndpoints(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value !== 'string' || !value.trim()) return '[]';

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('fallbackEndpoints must be a JSON array');
  return JSON.stringify(parsed);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const b = await req.json();

    // Only update fields that are actually provided
    const data: any = {};
    if (b.name !== undefined) data.name = b.name;
    if (b.upstreamName !== undefined) data.upstreamName = b.upstreamName;
    if (b.endpoint !== undefined) data.endpoint = b.endpoint || null;
    if (b.fallbackEndpoints !== undefined) data.fallbackEndpoints = normalizeFallbackEndpoints(b.fallbackEndpoints);
    if (b.imageFallbackModel !== undefined) data.imageFallbackModel = b.imageFallbackModel || null;
    if (b.provider !== undefined) data.provider = b.provider;
    if (b.inputPriceVND !== undefined) data.inputPriceVND = +b.inputPriceVND || 0;
    if (b.outputPriceVND !== undefined) data.outputPriceVND = +b.outputPriceVND || 0;
    if (b.enabled !== undefined) data.enabled = b.enabled;

    const model = await prisma.model.update({ where: { id }, data });
    return NextResponse.json({ ok: true, model });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.model.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
