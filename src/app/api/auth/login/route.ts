import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signSession } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/session';
import { z } from 'zod';

const schema = z.object({ email: z.string().min(3), password: z.string().min(6) });

// Simple in-memory login rate limiter per IP
const loginAttempts = new Map<string, { count: number; windowStart: number }>();
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 5;

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart >= LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json({ error: 'Quá nhiều lần thử. Vui lòng thử lại sau.' }, { status: 429 });
    }

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
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
