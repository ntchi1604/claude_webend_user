import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!b.tokenLimit || isNaN(+b.tokenLimit)) return NextResponse.json({ error: 'tokenLimit is required' }, { status: 400 });
    const plan = await prisma.plan.create({
      data: {
        name: b.name,
        description: b.description || null,
        tokenLimit: +b.tokenLimit,
        windowHours: +b.windowHours || 5,
        durationDays: +b.durationDays || 30,
        requestsPerMinute: +b.requestsPerMinute || 60,
        priceVND: +b.priceVND || 0,
        modelIds: JSON.stringify(b.modelIds || []),
        enabled: b.enabled ?? true
      }
    });
    return NextResponse.json({ ok: true, plan: { ...plan, tokenLimit: Number(plan.tokenLimit) } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
