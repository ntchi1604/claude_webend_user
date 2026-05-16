import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const action = body.action as string;
    if (action === 'ban') {
      await prisma.user.update({ where: { id: params.id }, data: { banned: true } });
    } else if (action === 'unban') {
      await prisma.user.update({ where: { id: params.id }, data: { banned: false } });
    } else if (action === 'grant') {
      const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      await prisma.$transaction([
        prisma.subscription.updateMany({ where: { userId: params.id, active: true }, data: { active: false } }),
        prisma.subscription.create({
          data: {
            userId: params.id,
            planId: plan.id,
            expiresAt: new Date(Date.now() + plan.durationDays * 86400_000)
          }
        })
      ]);
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
