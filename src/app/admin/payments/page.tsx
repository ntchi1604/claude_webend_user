import { prisma } from '@/lib/prisma';
import PaymentsClient from './payments-client';

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: { user: true, plan: true }
  });
  return (
    <PaymentsClient
      payments={payments.map((p) => ({
        id: p.id,
        userEmail: p.user.email,
        planName: p.plan.name,
        amountVND: p.amountVND,
        status: p.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        reference: p.reference,
        note: p.note,
        createdAt: p.createdAt.toISOString()
      }))}
    />
  );
}
