import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { getActiveSubscriptionOrFree } from '@/lib/subscription';

export async function GET() {
  try {
    const user = await requireUser();

    // Get user's active subscription, or automatically fall back to Free after Trial expires.
    const sub = await getActiveSubscriptionOrFree(user.id);

    if (!sub) {
      return NextResponse.json({ models: [] });
    }

    let modelFilter: string[] = [];
    if (sub.plan.modelIds) {
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
