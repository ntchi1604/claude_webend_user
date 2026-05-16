import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const b = await req.json();
    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        name: b.name,
        description: b.description || null,
        tokenLimit: +b.tokenLimit,
        windowHours: +b.windowHours,
        durationDays: +b.durationDays,
        priceVND: +b.priceVND,
        modelIds: JSON.stringify(b.modelIds || []),
        enabled: b.enabled
      }
    });
    return NextResponse.json({ ok: true, plan: { ...plan, tokenLimit: Number(plan.tokenLimit) } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.plan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
