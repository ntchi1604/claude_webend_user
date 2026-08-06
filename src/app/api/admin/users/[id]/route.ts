import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { planExpiresAt } from '@/lib/plans';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const action = body.action as string;
    if (action === 'ban') {
      await prisma.user.update({ where: { id }, data: { banned: true } });
    } else if (action === 'unban') {
      await prisma.user.update({ where: { id }, data: { banned: false } });
    } else if (action === 'grant') {
      const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      if (!plan.enabled) return NextResponse.json({ error: 'Plan đã bị tắt — không thể cấp' }, { status: 400 });
      await prisma.$transaction([
        prisma.subscription.updateMany({ where: { userId: id, active: true }, data: { active: false } }),
        prisma.subscription.create({
          data: {
            userId: id,
            planId: plan.id,
            expiresAt: planExpiresAt(plan)
          }
        })
      ]);
    } else if (action === 'extend') {
      const days = Number(body.days);
      if (!Number.isFinite(days) || days <= 0) return NextResponse.json({ error: 'days phải là số dương' }, { status: 400 });
      const sub = await prisma.subscription.findFirst({
        where: { userId: id, active: true },
        orderBy: { expiresAt: 'desc' }
      });
      if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
      const now = Date.now();
      const base = sub.expiresAt.getTime() > now ? sub.expiresAt.getTime() : now;
      const expiresAt = new Date(base + days * 86400_000);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { expiresAt }
      });
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
