import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await requireUser();

    // Get user's active subscription to find allowed models
    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id, active: true, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
      include: { plan: true }
    });

    let modelFilter: string[] = [];
    if (sub?.plan.modelIds) {
      try {
        modelFilter = JSON.parse(sub.plan.modelIds);
      } catch { }
    }

    // If plan has specific models, filter; otherwise return all enabled
    const where: any = { enabled: true };
    if (modelFilter.length > 0) {
      where.id = { in: modelFilter };
    }

    const models = await prisma.model.findMany({
      where,
      select: { id: true, name: true, provider: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ models });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 401 });
  }
}
