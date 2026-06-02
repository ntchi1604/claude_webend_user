import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { z } from 'zod';

const verifySchema = z.object({
  step: z.literal('verify'),
  adminConfirmPassword: z.string().min(1),
});

const changeSchema = z.object({
  step: z.literal('change'),
  adminConfirmPassword: z.string().min(1),
  targetEmail: z.string().email(),
  newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();

    if (body.step === 'verify') {
      const { adminConfirmPassword } = verifySchema.parse(body);
      if (!admin.adminConfirmPassword) {
        return NextResponse.json({ error: 'Admin chưa thiết lập mật khẩu xác nhận. Vui lòng vào Dashboard > Đổi thông tin để thiết lập trước.' }, { status: 400 });
      }
      const ok = await comparePassword(adminConfirmPassword, admin.adminConfirmPassword);
      if (!ok) {
        return NextResponse.json({ error: 'Mật khẩu xác nhận không đúng' }, { status: 403 });
      }
      return NextResponse.json({ verified: true });
    }

    if (body.step === 'change') {
      const input = changeSchema.parse(body);
      if (!admin.adminConfirmPassword) {
        return NextResponse.json({ error: 'Admin chưa thiết lập mật khẩu xác nhận.' }, { status: 400 });
      }
      const ok = await comparePassword(input.adminConfirmPassword, admin.adminConfirmPassword);
      if (!ok) {
        return NextResponse.json({ error: 'Mật khẩu xác nhận không đúng' }, { status: 403 });
      }

      const targetUser = await prisma.user.findUnique({ where: { email: input.targetEmail.toLowerCase() } });
      if (!targetUser) {
        return NextResponse.json({ error: 'Không tìm thấy người dùng với email này' }, { status: 404 });
      }

      const hashed = await hashPassword(input.newPassword);
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { password: hashed, passwordChangedAt: new Date() }
      });

      return NextResponse.json({
        success: true,
        message: `Đã đổi mật khẩu cho ${targetUser.email}`,
        targetEmail: targetUser.email
      });
    }

    return NextResponse.json({ error: 'step không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
