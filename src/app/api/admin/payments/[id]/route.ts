import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { planExpiresAt } from '@/lib/plans';
import { z } from 'zod';

const schema = z.object({ action: z.enum(['approve', 'reject']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action } = schema.parse(await req.json());

    // Atomic: update WHERE status='PENDING' prevents race condition
    if (action === 'reject') {
      const updated = await prisma.payment.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'REJECTED', reviewedBy: admin.id, reviewedAt: new Date() }
      });
      if (updated.count === 0) {
        return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    // approve: find payment first for plan info
    const payment = await prisma.payment.findUnique({ where: { id }, include: { plan: true } });
    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (payment.status !== 'PENDING') return NextResponse.json({ error: 'Already processed' }, { status: 400 });

    // Use transaction with atomic status update to prevent double-approve
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedBy: admin.id, reviewedAt: new Date() }
      });
      if (claimed.count === 0) throw new Error('ALREADY_PROCESSED');

      const now = new Date();
      const newerActive = await tx.subscription.findFirst({
        where: { userId: payment.userId, active: true, createdAt: { gt: payment.createdAt } }
      });
      if (newerActive) throw new Error('NEWER_SUBSCRIPTION');

      await tx.subscription.updateMany({ where: { userId: payment.userId, active: true }, data: { active: false } });
      await tx.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          expiresAt: planExpiresAt(payment.plan, now.getTime())
        }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e?.message === 'ALREADY_PROCESSED') return NextResponse.json({ error: 'Already processed' }, { status: 409 });
    if (e?.message === 'NEWER_SUBSCRIPTION') return NextResponse.json({ error: 'Người dùng đã có gói mới hơn — bỏ qua approve' }, { status: 409 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
