import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

function numberOrDefault(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!b.unlimitedTokens && (!b.tokenLimit || isNaN(+b.tokenLimit))) return NextResponse.json({ error: 'tokenLimit is required' }, { status: 400 });
    const plan = await prisma.plan.create({
      data: {
        name: b.name,
        description: b.description || null,
        tokenLimit: b.unlimitedTokens ? 0 : +b.tokenLimit,
        unlimitedTokens: b.unlimitedTokens ?? false,
        windowHours: numberOrDefault(b.windowHours, 5),
        durationDays: numberOrDefault(b.durationDays, 30),
        durationHours: b.durationHours ? +b.durationHours : null,
        requestsPerMinute: numberOrDefault(b.requestsPerMinute, 60),
        priceVND: numberOrDefault(b.priceVND, 0),
        modelIds: JSON.stringify(b.modelIds || []),
        enabled: b.enabled ?? true
      }
    });
    return NextResponse.json({ ok: true, plan: { ...plan, tokenLimit: Number(plan.tokenLimit) } });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Plan name already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
