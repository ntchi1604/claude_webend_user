import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
  newEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword, newEmail } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Email không tồn tại' }, { status: 404 });
    }

    const hashed = await hashPassword(newPassword);
    const updateData: any = { password: hashed };
    if (newEmail && newEmail !== email) {
      const exists = await prisma.user.findUnique({ where: { email: newEmail } });
      if (exists) {
        return NextResponse.json({ error: 'Email mới đã được sử dụng' }, { status: 409 });
      }
      updateData.email = newEmail;
    }

    await prisma.user.update({ where: { email }, data: updateData });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message || 'Lỗi server' }, { status: 500 });
  }
}
