import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { z } from 'zod';

const schema = z.object({
  targetEmail: z.string().email(),
  newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { targetEmail, newPassword } = schema.parse(body);

    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail.toLowerCase() } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng với email này' }, { status: 404 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { password: hashed, passwordChangedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: `Đã đổi mật khẩu cho ${targetUser.email}`,
    });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e?.name === 'ZodError') return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
