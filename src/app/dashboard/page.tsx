import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';
import Countdown from '@/components/countdown';

export default async function DashboardPage() {
  const user = await requireUser();

  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, active: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
    include: { plan: true }
  });

  const windowStart = sub ? new Date(Date.now() - sub.plan.windowHours * 3600 * 1000) : new Date();
  const usage = await prisma.usageLog.aggregate({
    where: { userId: user.id, ts: { gte: windowStart } },
    _sum: { totalTokens: true }
  });
  const used = usage._sum.totalTokens ?? 0;
  const limit = Number(sub?.plan.tokenLimit ?? 0);
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const keyCount = await prisma.apiKey.count({ where: { userId: user.id, active: true } });
  const totalRequests = await prisma.usageLog.count({ where: { userId: user.id } });

  // Calculate rolling reset time
  const earliest = await prisma.usageLog.findFirst({
    where: { userId: user.id, ts: { gte: windowStart } },
    orderBy: { ts: 'asc' },
    select: { ts: true }
  });
  const windowHours = sub?.plan.windowHours ?? 5;
  const resetAt = earliest ? new Date(earliest.ts.getTime() + windowHours * 3600 * 1000) : null;
  const now = new Date();
  let resetText = 'Không có dữ liệu';
  if (resetAt && resetAt > now) {
    const diffMs = resetAt.getTime() - now.getTime();
    const diffMin = Math.ceil(diffMs / 60000);
    if (diffMin >= 60) {
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      resetText = `${h}h${m > 0 ? ` ${m}p` : ''} nữa`;
    } else {
      resetText = `${diffMin} phút nữa`;
    }
  } else if (used === 0) {
    resetText = 'Chưa sử dụng';
  } else {
    resetText = 'Đã reset';
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="heading-1">Xin chào{user.name ? `, ${user.name}` : ''}</h1>
        <p className="body-sm text-[var(--stone-600)] mt-1">Gói hiện tại: <b>{sub?.plan.name ?? 'Không có'}</b></p>
      </div>

      {/* Quota card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="label">Quota ({windowHours}h rolling)</span>
          <span className="caption">{formatNumber(used)} / {formatNumber(limit)} tokens</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--cream-50)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct > 90 ? 'var(--error)' : pct > 70 ? 'var(--brand-orange)' : 'var(--brand-blue)'
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="caption">Còn lại: {formatNumber(remaining)}</span>
          <span className="caption">Reset: <Countdown resetAt={resetAt ? resetAt.toISOString() : null} /></span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="caption mb-1">API Keys</div>
          <div className="heading-2">{keyCount}</div>
          <Link href="/dashboard/keys" className="caption mt-2 inline-block" style={{ color: 'var(--brand-blue)' }}>Quản lý →</Link>
        </div>
        <div className="card">
          <div className="caption mb-1">Tổng requests</div>
          <div className="heading-2">{formatNumber(totalRequests)}</div>
          <Link href="/dashboard/usage" className="caption mt-2 inline-block" style={{ color: 'var(--brand-blue)' }}>Xem chi tiết →</Link>
        </div>
        <div className="card">
          <div className="caption mb-1">Gói cước</div>
          <div className="heading-2">{sub?.plan.name ?? '—'}</div>
          <Link href="/dashboard/plans" className="caption mt-2 inline-block" style={{ color: 'var(--brand-blue)' }}>Nâng cấp →</Link>
        </div>
      </div>

      {/* Quick start */}
      <div className="card-code">
        <div className="caption mb-2" style={{ color: '#629987' }}>Quick start</div>
        <pre className="whitespace-pre-wrap text-[13px] leading-5">{`# Cursor / Cline / Continue
Base URL: ${process.env.APP_URL || 'http://localhost:3000'}/v1
API Key:  sk-cw-...

# Claude Code
$env:ANTHROPIC_BASE_URL="${process.env.APP_URL || 'http://localhost:3000'}"
$env:ANTHROPIC_AUTH_TOKEN="sk-cw-..."
claude`}</pre>
      </div>
    </div>
  );
}
