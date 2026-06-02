import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword, signSession } from '@/lib/auth';
import { getSessionFromRequest, SESSION_COOKIE } from '@/lib/session';
import { z } from 'zod';

const changeEmailSchema = z.object({
  action: z.literal('change-email'),
  currentPassword: z.string().min(6),
  newEmail: z.string().email(),
});

const changePasswordSchema = z.object({
  action: z.literal('change-password'),
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action;

    if (action === 'change-email') {
      return await handleChangeEmail(session.uid, changeEmailSchema.parse(body));
    }

    if (action === 'change-password') {
      return await handleChangePassword(session.uid, changePasswordSchema.parse(body));
    }

    return NextResponse.json({ error: 'action không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

async function handleChangeEmail(userId: string, input: z.infer<typeof changeEmailSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
  }

  const ok = await comparePassword(input.currentPassword, user.password);
  if (!ok) {
    return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 403 });
  }

  const newEmail = input.newEmail.toLowerCase();
  if (newEmail === user.email) {
    return NextResponse.json({ error: 'Email mới giống email hiện tại' }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) {
    return NextResponse.json({ error: 'Email mới đã được sử dụng' }, { status: 409 });
  }

  await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });

  const newToken = await signSession({
    uid: user.id,
    email: newEmail,
    role: user.role as any,
    pwChangedAt: user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : undefined
  });
  const res = NextResponse.json({ success: true, message: 'Đổi email thành công!' });
  res.cookies.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  return res;
}

async function handleChangePassword(userId: string, input: z.infer<typeof changePasswordSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
  }

  const ok = await comparePassword(input.currentPassword, user.password);
  if (!ok) {
    return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 403 });
  }

  const hashed = await hashPassword(input.newPassword);
  const now = new Date();
  await prisma.user.update({ where: { id: userId }, data: { password: hashed, passwordChangedAt: now } });

  const newToken = await signSession({
    uid: user.id,
    email: user.email,
    role: user.role as any,
    pwChangedAt: Math.floor(now.getTime() / 1000)
  });
  const res = NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  res.cookies.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  return res;
}
