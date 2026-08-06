import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import UsageChart from './chart';
import { formatNumber } from '@/lib/utils';

function statusClass(status: number) {
  if (status >= 200 && status < 300) return 'usage-status-ok';
  if (status >= 400 && status < 500) return 'usage-status-warn';
  if (status >= 500) return 'usage-status-error';
  return 'usage-status-muted';
}

export default async function UsagePage() {
  const user = await requireUser();
  const since = new Date(Date.now() - 30 * 86400_000);
  const logs = await prisma.usageLog.findMany({
    where: { userId: user.id, ts: { gte: since } },
    orderBy: { ts: 'asc' },
    select: { ts: true, totalTokens: true, modelName: true, status: true }
  });

  // Gom dữ liệu theo ngày (múi giờ địa phương của user) và theo model để vẽ biểu đồ.
  const byDay = new Map<string, number>();
  const byModel = new Map<string, number>();
  let total = 0;
  for (const l of logs) {
    const d = l.ts.toLocaleDateString('sv-SE'); // YYYY-MM-DD theo giờ local
    byDay.set(d, (byDay.get(d) ?? 0) + l.totalTokens);
    byModel.set(l.modelName, (byModel.get(l.modelName) ?? 0) + l.totalTokens);
    total += l.totalTokens;
  }
  const daySeries = Array.from(byDay.entries()).map(([day, tokens]) => ({ day, tokens }));
  const modelSeries = Array.from(byModel.entries())
    .map(([model, tokens]) => ({ model, tokens }))
    .sort((a, b) => b.tokens - a.tokens);

  const recent = await prisma.usageLog.findMany({
    where: { userId: user.id },
    orderBy: { ts: 'desc' },
    take: 20
  });

  return (
    <div className="app-page animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Sử dụng</h1>
        <p className="text-zinc-500">Thống kê 30 ngày gần nhất.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-zinc-500">Tổng token (30d)</div>
          <div className="mt-2 text-2xl font-bold">{formatNumber(total)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-zinc-500">Số request</div>
          <div className="mt-2 text-2xl font-bold">{formatNumber(logs.length)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-zinc-500">Model đã dùng</div>
          <div className="mt-2 text-2xl font-bold">{modelSeries.length}</div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Token theo ngày</h2>
        <UsageChart data={daySeries} />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Theo model</h2>
        <div className="space-y-2">
          {modelSeries.map((m) => (
            <div key={m.model} className="flex items-center justify-between text-sm">
              <span>{m.model}</span>
              <span className="text-zinc-500">{formatNumber(m.tokens)} tok</span>
            </div>
          ))}
          {modelSeries.length === 0 && <div className="text-zinc-500 text-sm">Chưa có dữ liệu.</div>}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-left">
            <tr>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Model</th>
              <th className="p-3">Prompt</th>
              <th className="p-3">Completion</th>
              <th className="p-3">Tổng</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <td className="p-3">{r.ts.toLocaleString('vi-VN')}</td>
                <td className="p-3">{r.modelName}</td>
                <td className="p-3">{formatNumber(r.promptTokens)}</td>
                <td className="p-3">{formatNumber(r.completionTokens)}</td>
                <td className="p-3 font-medium">{formatNumber(r.totalTokens)}</td>
                <td className="p-3"><span className={`usage-status-badge ${statusClass(r.status)}`}>{r.status}</span></td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-zinc-500">Chưa có log</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
