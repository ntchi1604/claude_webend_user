import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const conv = await prisma.conversation.findFirst({ where: { id: params.id, userId: user.id } });
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
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
