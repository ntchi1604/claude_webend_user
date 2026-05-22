import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

function numberOrDefault(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const b = await req.json();
    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        name: b.name,
        description: b.description || null,
        tokenLimit: b.unlimitedTokens ? 0 : numberOrDefault(b.tokenLimit, 0),
        unlimitedTokens: b.unlimitedTokens ?? false,
        windowHours: numberOrDefault(b.windowHours, 5),
        durationDays: numberOrDefault(b.durationDays, 30),
        durationHours: b.durationHours ? +b.durationHours : null,
        requestsPerMinute: numberOrDefault(b.requestsPerMinute, 60),
        priceVND: numberOrDefault(b.priceVND, 0),
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