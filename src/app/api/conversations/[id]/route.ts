import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';
import { z } from 'zod';

const titleSchema = z.string().min(1).max(200);

async function getUser(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || user.banned) return null;
  return user;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(conversation);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const title = titleSchema.parse(body.title);
  const conversation = await prisma.conversation.updateMany({
    where: { id, userId: user.id },
    data: { title }
  });
  if (conversation.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { conversation: { id, userId: user.id } } }),
    prisma.conversation.deleteMany({ where: { id, userId: user.id } })
  ]);
  return NextResponse.json({ ok: true });
}
