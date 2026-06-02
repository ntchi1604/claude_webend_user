import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

const MAX_CONVERSATIONS = 50;
const MAX_AGE_DAYS = 30;

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, model: true, updatedAt: true, createdAt: true }
  });
  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: body.title || 'New conversation',
        model: body.model || null
      }
    });

    cleanup(user.id);

    return NextResponse.json(conversation);
  } catch (e: any) {
    console.error('[conversations POST]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

async function getSessionUser(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || user.banned) return null;
  return user;
}

async function cleanup(userId: string) {
  try {
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400000);
    await prisma.$transaction(async (tx) => {
      await tx.chatMessage.deleteMany({
        where: { conversation: { userId, updatedAt: { lt: cutoff } } }
      });
      await tx.conversation.deleteMany({
        where: { userId, updatedAt: { lt: cutoff } }
      });

      const count = await tx.conversation.count({ where: { userId } });
      if (count > MAX_CONVERSATIONS) {
        const oldest = await tx.conversation.findMany({
          where: { userId },
          orderBy: { updatedAt: 'asc' },
          take: count - MAX_CONVERSATIONS,
          select: { id: true }
        });
        const ids = oldest.map((c) => c.id);
        await tx.chatMessage.deleteMany({ where: { conversationId: { in: ids } } });
        await tx.conversation.deleteMany({ where: { id: { in: ids } } });
      }
    });
  } catch {}
}
