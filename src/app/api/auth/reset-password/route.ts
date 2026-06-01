import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/auth';
import { getSessionFromRequest, SESSION_COOKIE } from '@/lib/session';
import { z } from 'zod';

// Password reset now REQUIRES an authenticated session.
// The user must provide their current password to change it.
const schema = z.object({
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
    const { currentPassword, newPassword } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: session.uid } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 403 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
