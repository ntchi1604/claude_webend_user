import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

function normalizeFallbackEndpoints(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value !== 'string' || !value.trim()) return '[]';

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('fallbackEndpoints must be a JSON array');
  return JSON.stringify(parsed);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const model = await prisma.model.create({
      data: {
        name: b.name,
        upstreamName: b.upstreamName,
        endpoint: b.endpoint || null,
        fallbackEndpoints: normalizeFallbackEndpoints(b.fallbackEndpoints),
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
