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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const b = await req.json();
    const model = await prisma.model.update({
      where: { id: params.id },
      data: {
        name: b.name,
        upstreamName: b.upstreamName,
        endpoint: b.endpoint || null,
        fallbackEndpoints: normalizeFallbackEndpoints(b.fallbackEndpoints),
        provider: b.provider,
        inputPriceVND: +b.inputPriceVND,
        outputPriceVND: +b.outputPriceVND,
        enabled: b.enabled
      }
    });
    return NextResponse.json({ ok: true, model });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.model.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
