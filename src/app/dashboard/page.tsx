import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatNumber } from '@/lib/utils';
import { getActiveSubscriptionOrFree } from '@/lib/subscription';
import { isUnlimitedTokens } from '@/lib/plans';
import { getPublicOrigin } from '@/lib/public-url';
import Link from 'next/link';
import Countdown from '@/components/countdown';
import { Activity, ArrowUpRight, Clock, KeyRound, MessageSquare, Package, ShieldCheck, Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatRemainingTime(expiresAt: Date) {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Đã hết hạn';
  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

export default async function DashboardPage() {
  const publicOrigin = getPublicOrigin();
  const codexBaseUrl = publicOrigin ? `${publicOrigin}/v1` : '/v1';
  const user = await requireUser();
  const sub = await getActiveSubscriptionOrFree(user.id);

  const windowHours = sub?.plan.windowHours ?? 5;
  const windowMs = windowHours * 3600 * 1000;

  let resetAt: Date | null = null;
  let used = 0;

  if (sub) {
    const now = Date.now();
    if (sub.quotaResetAt && sub.quotaResetAt.getTime() > now) {
      resetAt = sub.quotaResetAt;
      const windowStart = new Date(resetAt.getTime() - windowMs);
      const agg = await prisma.usageLog.aggregate({
        where: { userId: user.id, ts: { gte: windowStart } },
        _sum: { totalTokens: true }
      });
      used = agg._sum.totalTokens ?? 0;
    }
  }

  const unlimitedTokens = isUnlimitedTokens(sub?.plan ?? {});
  const limit = Number(sub?.plan.tokenLimit ?? 0);
  const remaining = unlimitedTokens ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - used);
  const pct = unlimitedTokens || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const keyCount = await prisma.apiKey.count({ where: { userId: user.id, active: true } });
  const totalRequests = await prisma.usageLog.count({ where: { userId: user.id } });
  const planName = sub?.plan.name ?? 'Chưa có gói';
  const status = sub ? 'Đang hoạt động' : 'Chưa kích hoạt';
  const planRemaining = sub ? formatRemainingTime(sub.expiresAt) : '—';

  const stats = [
    { label: 'Token còn lại', value: unlimitedTokens ? 'Không giới hạn' : formatNumber(remaining), icon: Activity, href: '/dashboard/usage', tone: 'blue' },
    { label: 'API key hoạt động', value: formatNumber(keyCount), icon: KeyRound, href: '/dashboard/keys', tone: 'green' },
    { label: 'Tổng request', value: formatNumber(totalRequests), icon: Terminal, href: '/dashboard/usage', tone: 'mauve' },
    { label: 'Gói hiện tại', value: planName, icon: Package, href: '/dashboard/plans', tone: 'orange' },
    { label: 'Thời gian còn lại', value: planRemaining, icon: Clock, href: '/dashboard/plans', tone: 'green' }
  ];

  return (
    <div className="dashboard-overview animate-fade-in">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Api4Cheap dashboard</p>
          <h1 className="dashboard-title">Xin chào{user.name ? `, ${user.name}` : ''}</h1>
          <p className="dashboard-subtitle">Theo dõi quota, API key và truy cập nhanh các công cụ tích hợp.</p>
        </div>
        <div className="dashboard-status">
          <ShieldCheck className="h-4 w-4" />
          <span>{status}</span>
        </div>
      </section>

      <section className="dashboard-grid-main">
        <div className="dashboard-quota-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="caption">Hạn mức cửa sổ {windowHours} giờ</p>
              <h2>{formatNumber(used)} / {unlimitedTokens ? 'Unlimited' : formatNumber(limit)} token</h2>
            </div>
            <div className="dashboard-percent">{pct}%</div>
          </div>
          <div className="dashboard-meter" aria-label="Quota usage">
            <div
              className="dashboard-meter-fill"
              style={{
                width: `${pct}%`,
                background: pct > 90 ? 'var(--error)' : pct > 70 ? 'var(--brand-orange)' : 'var(--brand-blue)'
              }}
            />
          </div>
          <div className="dashboard-quota-meta">
            <span>{unlimitedTokens ? 'Unlimited tokens' : `Còn ${formatNumber(remaining)} token`}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Reset <Countdown resetAt={resetAt ? resetAt.toISOString() : null} /></span>
          </div>
          <div className="dashboard-actions-row">
            <Link href="/dashboard/keys" className="dashboard-action-primary">Tạo API key <ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/dashboard/plans" className="dashboard-action-secondary">Nâng cấp gói</Link>
          </div>
        </div>

        <div className="dashboard-side-panel">
          <p className="caption">Truy cập nhanh</p>
          <Link href="/chat" className="dashboard-quick-link"><MessageSquare className="h-4 w-4" /> Chat playground <ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/dashboard/docs" className="dashboard-quick-link"><Terminal className="h-4 w-4" /> Cài đặt CLI <ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/dashboard/billing" className="dashboard-quick-link"><Package className="h-4 w-4" /> Nạp gói <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="dashboard-stat-grid">
        {stats.map((item) => (
          <Link href={item.href} key={item.label} className={`dashboard-stat-card dashboard-stat-${item.tone}`}>
            <div className="dashboard-stat-icon"><item.icon className="h-4 w-4" /></div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </Link>
        ))}
      </section>

      <section className="dashboard-code-panel">
        <div>
          <p className="caption">Endpoint</p>
          <h2 className="heading-5">Kết nối gateway</h2>
        </div>
        <pre>{`# Claude Code
Base URL: ${publicOrigin || '/'}
API Key:  YOUR_API_KEY

# Codex CLI
Base URL: ${codexBaseUrl}
API Key:  YOUR_API_KEY`}</pre>
      </section>
    </div>
  );
}
