import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { z } from 'zod';

const schema = z.object({ action: z.enum(['approve', 'reject']) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const { action } = schema.parse(await req.json());
    const payment = await prisma.payment.findUnique({ where: { id: params.id }, include: { plan: true } });
    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (payment.status !== 'PENDING') return NextResponse.json({ error: 'Already processed' }, { status: 400 });

    if (action === 'reject') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REJECTED', reviewedBy: admin.id, reviewedAt: new Date() }
      });
      return NextResponse.json({ ok: true });
    }

    // approve: deactivate previous subs, create new
    await prisma.$transaction([
      prisma.subscription.updateMany({ where: { userId: payment.userId, active: true }, data: { active: false } }),
      prisma.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          expiresAt: new Date(Date.now() + payment.plan.durationDays * 86400_000)
        }
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'APPROVED', reviewedBy: admin.id, reviewedAt: new Date() }
      })
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
