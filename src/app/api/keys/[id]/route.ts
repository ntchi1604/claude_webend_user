import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { z } from 'zod';

const patchSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().max(64).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const k = await prisma.apiKey.findUnique({ where: { id } });
    if (!k || k.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data: any = {};
    if (body.active !== undefined) data.active = body.active;
    if (body.name !== undefined) data.name = body.name;
    const updated = await prisma.apiKey.update({ where: { id }, data });
    return NextResponse.json({ ok: true, key: { id: updated.id, active: updated.active, name: updated.name } });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const k = await prisma.apiKey.findUnique({ where: { id } });
    if (!k || k.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
