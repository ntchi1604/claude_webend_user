import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const k = await prisma.apiKey.findUnique({ where: { id: params.id } });
    if (!k || k.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.apiKey.update({
      where: { id: params.id },
      data: { active: typeof body.active === 'boolean' ? body.active : undefined, name: body.name }
    });
    return NextResponse.json({ ok: true, key: { id: updated.id, active: updated.active, name: updated.name } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const k = await prisma.apiKey.findUnique({ where: { id: params.id } });
    if (!k || k.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.apiKey.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 400 });
  }
}
