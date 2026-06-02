import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword, signSession } from '@/lib/auth';
import { getSessionFromRequest, SESSION_COOKIE } from '@/lib/session';
import { z } from 'zod';

const changeEmailSchema = z.object({
  action: z.literal('change-email'),
  currentEmail: z.string().email(),
  newEmail: z.string().email(),
  adminConfirmPassword: z.string().min(1),
});

const changePasswordSchema = z.object({
  action: z.literal('change-password'),
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  adminConfirmPassword: z.string().min(1),
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

    return NextResponse.json({ error: 'action không hợp lệ. Dùng "change-email" hoặc "change-password".' }, { status: 400 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

async function verifyAdminConfirm(userId: string, adminConfirmPassword: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  // Find any admin with a confirm password set
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', adminConfirmPassword: { not: null } },
    select: { id: true, adminConfirmPassword: true }
  });

  if (admins.length === 0) {
    return { ok: false, error: 'Chưa có admin nào thiết lập mật khẩu xác nhận. Vui lòng liên hệ quản trị viên.', status: 503 };
  }

  // Check against all admins' confirm passwords
  for (const admin of admins) {
    if (admin.adminConfirmPassword) {
      const match = await comparePassword(adminConfirmPassword, admin.adminConfirmPassword);
      if (match) return { ok: true };
    }
  }

  return { ok: false, error: 'Mật khẩu xác nhận admin không đúng', status: 403 };
}

async function handleChangeEmail(userId: string, input: z.infer<typeof changeEmailSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
  }

  // Verify current email matches
  if (user.email !== input.currentEmail.toLowerCase()) {
    return NextResponse.json({ error: 'Email hiện tại không đúng' }, { status: 403 });
  }

  // Verify admin confirm password
  const adminCheck = await verifyAdminConfirm(userId, input.adminConfirmPassword);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  // Check new email not already taken
  const newEmail = input.newEmail.toLowerCase();
  if (newEmail === user.email) {
    return NextResponse.json({ error: 'Email mới giống email hiện tại' }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) {
    return NextResponse.json({ error: 'Email mới đã được sử dụng' }, { status: 409 });
  }

  // Update email
  await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });

  // Re-issue session with new email
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

  // Verify current password
  const ok = await comparePassword(input.currentPassword, user.password);
  if (!ok) {
    return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 403 });
  }

  // Verify admin confirm password
  const adminCheck = await verifyAdminConfirm(userId, input.adminConfirmPassword);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  // Update password
  const hashed = await hashPassword(input.newPassword);
  const now = new Date();
  await prisma.user.update({ where: { id: userId }, data: { password: hashed, passwordChangedAt: now } });

  // Re-issue session with pwChangedAt so old JWTs are invalidated
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
