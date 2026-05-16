import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { z } from 'zod';

const schema = z.object({ planId: z.string(), reference: z.string().optional(), note: z.string().optional() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { planId, reference, note } = schema.parse(body);
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.enabled) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId,
        amountVND: plan.priceVND,
        reference: reference || null,
        note: note || null
      }
    });
    return NextResponse.json({ ok: true, id: payment.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
