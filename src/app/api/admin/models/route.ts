import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    const model = await prisma.model.create({
      data: {
        name: b.name,
        upstreamName: b.upstreamName,
        endpoint: b.endpoint || null,
        provider: b.provider || 'openai',
        inputPriceVND: +b.inputPriceVND || 0,
        outputPriceVND: +b.outputPriceVND || 0,
        enabled: b.enabled ?? true
      }
    });
    return NextResponse.json({ ok: true, model });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
