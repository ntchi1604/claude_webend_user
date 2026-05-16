import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

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
