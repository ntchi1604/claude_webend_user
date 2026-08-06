import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || user.banned) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conv = await prisma.conversation.findFirst({ where: { id, userId: session.uid } });
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const allowedRoles = ['user', 'assistant'];
  const role = allowedRoles.includes(body.role) ? body.role : 'user';
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: id,
      role,
      content: typeof body.content === 'string' ? body.content : JSON.stringify(body.content)
    }
  });

  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() }
  });

  return NextResponse.json(message);
}
