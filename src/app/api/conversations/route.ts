import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

const MAX_CONVERSATIONS = 50;
const MAX_AGE_DAYS = 30;

export async function GET() {
  try {
    const user = await requireUser();
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, model: true, updatedAt: true, createdAt: true }
    });
    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
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
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

async function cleanup(userId: string) {
  try {
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400000);
    await prisma.chatMessage.deleteMany({
      where: { conversation: { userId, updatedAt: { lt: cutoff } } }
    });
    await prisma.conversation.deleteMany({
      where: { userId, updatedAt: { lt: cutoff } }
    });

    const count = await prisma.conversation.count({ where: { userId } });
    if (count > MAX_CONVERSATIONS) {
      const oldest = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'asc' },
        take: count - MAX_CONVERSATIONS,
        select: { id: true }
      });
      const ids = oldest.map((c) => c.id);
      await prisma.chatMessage.deleteMany({ where: { conversationId: { in: ids } } });
      await prisma.conversation.deleteMany({ where: { id: { in: ids } } });
    }
  } catch {}
}
