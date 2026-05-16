import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signSession } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/session';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = schema.parse(body);
    const lower = email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: lower } });
    if (exists) return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 409 });
    const hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email: lower, password: hash, name: name ?? null }
    });

    const free = await prisma.plan.findUnique({ where: { name: 'Free' } });
    if (free) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: free.id,
          expiresAt: new Date(Date.now() + free.durationDays * 86400_000)
        }
      });
    }

    const token = await signSession({ uid: user.id, email: user.email, role: user.role as any });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}
