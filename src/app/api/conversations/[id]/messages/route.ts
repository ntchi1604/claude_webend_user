import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findFirst({ where: { id: params.id, userId: session.uid } });
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.id,
      role: body.role,
      content: typeof body.content === 'string' ? body.content : JSON.stringify(body.content)
    }
  });

  await prisma.conversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() }
  });

  return NextResponse.json(message);
}
