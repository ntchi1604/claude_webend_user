import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import {
  assertFallbackUpstreamsExist,
  FallbackConfigError,
  normalizeFallbackUpstreams,
  normalizeImageFallbackUpstream
} from '@/lib/model-fallback-config';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const fallback = normalizeFallbackUpstreams(b.fallbackEndpoints);
    const imageFallback = normalizeImageFallbackUpstream(b.imageFallbackModel);
    await assertFallbackUpstreamsExist([
      ...fallback.upstreamNames,
      ...(imageFallback ? [imageFallback] : [])
    ]);
    const model = await prisma.model.create({
      data: {
        name: b.name,
        upstreamName: b.upstreamName || b.name,
        endpoint: b.endpoint || null,
        fallbackEndpoints: fallback.serialized,
        imageFallbackModel: imageFallback,
        provider: b.provider || 'openai',
        inputPriceVND: +b.inputPriceVND || 0,
        outputPriceVND: +b.outputPriceVND || 0,
        enabled: b.enabled ?? true
      }
    });
    return NextResponse.json({ ok: true, model });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e instanceof FallbackConfigError) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Model name already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
