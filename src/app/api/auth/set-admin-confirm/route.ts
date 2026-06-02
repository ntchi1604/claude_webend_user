import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/auth';
import { getSessionFromRequest } from '@/lib/session';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().min(6),
  adminConfirmPassword: z.string().min(6),
});

/**
 * POST /api/auth/set-admin-confirm
 * Admin sets their confirmation password (used to authorize user email/password changes).
 * Requires admin to authenticate with their own login password first.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.uid } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ admin mới có quyền này' }, { status: 403 });
    }

    const body = await req.json();
    const { currentPassword, adminConfirmPassword } = schema.parse(body);

    // Verify admin's login password
    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Mật khẩu đăng nhập không đúng' }, { status: 403 });
    }

    // Hash and save the confirm password
    const hashed = await hashPassword(adminConfirmPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { adminConfirmPassword: hashed }
    });

    return NextResponse.json({ success: true, message: 'Đã thiết lập mật khẩu xác nhận admin.' });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
