import { prisma } from '@/lib/prisma';
import { formatNumber } from '@/lib/utils';

export default async function AdminHome() {
  const [users, payments, pending, totalTokens] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count({ where: { status: 'APPROVED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.usageLog.aggregate({ _sum: { totalTokens: true } })
  ]);
  const revenue = await prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amountVND: true } });

  const cards = [
    { label: 'Users', value: formatNumber(users) },
    { label: 'Thanh toán đã duyệt', value: formatNumber(payments) },
    { label: 'Chờ duyệt', value: formatNumber(pending) },
    { label: 'Tổng token', value: formatNumber(totalTokens._sum.totalTokens ?? 0) },
    { label: 'Doanh thu', value: (revenue._sum.amountVND ?? 0).toLocaleString('vi-VN') + 'đ' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Bảng điều khiển admin</h1>
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-sm text-zinc-500">{c.label}</div>
            <div className="mt-2 text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
