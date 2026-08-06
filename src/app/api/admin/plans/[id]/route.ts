import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const b = await req.json();

    // Only update fields that are actually provided
    const data: any = {};
    if (b.name !== undefined) data.name = b.name;
    if (b.description !== undefined) data.description = b.description || null;
    if (b.unlimitedTokens !== undefined) data.unlimitedTokens = b.unlimitedTokens;
    if (b.tokenLimit !== undefined) data.tokenLimit = b.unlimitedTokens ? 0 : Number(b.tokenLimit);
    if (b.windowHours !== undefined) data.windowHours = Number(b.windowHours) || 5;
    if (b.durationDays !== undefined) data.durationDays = Number(b.durationDays) || 30;
    if (b.durationHours !== undefined) data.durationHours = b.durationHours ? Number(b.durationHours) : null;
    if (b.requestsPerMinute !== undefined) data.requestsPerMinute = Number(b.requestsPerMinute) || 60;
    if (b.priceVND !== undefined) data.priceVND = Number(b.priceVND) || 0;
    if (b.modelIds !== undefined) data.modelIds = JSON.stringify(b.modelIds || []);
    if (b.enabled !== undefined) {
      if (b.enabled === false) {
        const existing = await prisma.plan.findUnique({ where: { id } });
        if (existing?.name === 'Free') {
          return NextResponse.json({ error: 'Không thể tắt gói Free' }, { status: 400 });
        }
      }
      data.enabled = b.enabled;
    }

    const plan = await prisma.plan.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      plan: { ...plan, tokenLimit: Number(plan.tokenLimit), priceVND: Number(plan.priceVND) }
    });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    if (plan.name === 'Free') {
      return NextResponse.json({ error: 'Không thể xoá gói Free — người dùng mới phụ thuộc vào nó' }, { status: 400 });
    }
    const referenced = await prisma.subscription.count({ where: { planId: id } });
    if (referenced > 0) {
      return NextResponse.json({ error: `Gói đang được ${referenced} subscription sử dụng — không thể xoá` }, { status: 400 });
    }
    const paymentCount = await prisma.payment.count({ where: { planId: id } });
    if (paymentCount > 0) {
      return NextResponse.json({ error: 'Gói có lịch sử thanh toán — không thể xoá' }, { status: 400 });
    }
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
