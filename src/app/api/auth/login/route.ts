import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signSession } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/session';
import { z } from 'zod';

const schema = z.object({ email: z.string().min(3), password: z.string().min(6) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: 'Email hoặc mật khẩu sai' }, { status: 401 });
    const ok = await comparePassword(password, user.password);
    if (!ok) return NextResponse.json({ error: 'Email hoặc mật khẩu sai' }, { status: 401 });
    if (user.banned) return NextResponse.json({ error: 'Tài khoản bị khoá' }, { status: 403 });
    const token = await signSession({ uid: user.id, email: user.email, role: user.role as any });
    const res = NextResponse.json({ ok: true, role: user.role });
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
