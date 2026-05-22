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
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}