import Link from 'next/link';
import { ArrowRight, Code2, RefreshCw, Shield, Sparkles, Terminal } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { prisma } from '@/lib/prisma';
import { formatNumber, formatVND } from '@/lib/utils';
import { parseModelIds } from '@/lib/json';
import { getPublicOrigin } from '@/lib/public-url';

const steps = [
  { num: '01', title: 'Tạo tài khoản', desc: 'Đăng ký rồi mở dashboard.' },
  { num: '02', title: 'Tạo API key', desc: 'Vào mục API key và tạo secret mới.' },
  { num: '03', title: 'Chạy thiết lập nhanh', desc: 'Chọn Claude Code hoặc Codex CLI rồi chạy lệnh cài đặt.' },
];

export default async function HomePage() {
  const publicOrigin = getPublicOrigin();
  const claudeBaseUrl = publicOrigin || 'https://your-domain';
  const codexBaseUrl = publicOrigin ? `${publicOrigin}/v1` : 'https://your-domain/v1';
  const features = [
    {
      icon: Terminal,
      title: 'Sẵn sàng cho Claude Code',
      desc: `Dùng ANTHROPIC_BASE_URL=${claudeBaseUrl} cùng key Api4Cheap của bạn.`,
    },
    {
      icon: Code2,
      title: 'Sẵn sàng cho Codex CLI',
      desc: `Dùng provider api4cheap, Responses API và base URL ${codexBaseUrl}.`,
    },
    {
      icon: RefreshCw,
      title: 'Hạn mức cuộn chiếu',
      desc: 'Gói dịch vụ tự đặt lại theo cửa sổ thời gian, giúp phiên coding dài không bị gián đoạn.',
    },
    {
      icon: Shield,
      title: 'Theo dõi minh bạch',
      desc: 'Mức dùng được tính từ token upstream để giới hạn luôn rõ ràng.',
    },
  ];

  const dbPlans = await prisma.plan.findMany({ where: { enabled: true }, orderBy: { priceVND: 'asc' } });
  const models = await prisma.model.findMany();
  const modelMap = new Map(models.map((m) => [m.id, m.name]));

  const plans = dbPlans.map((p, i) => ({
    name: p.name,
    tokens: formatNumber(Number(p.tokenLimit)),
    price: formatVND(p.priceVND),
    windowHours: p.windowHours,
    models: parseModelIds(p.modelIds).map((id) => modelMap.get(id)).filter((n): n is string => !!n),
    highlight: i === Math.min(2, dbPlans.length - 1),
  }));

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream-100)' }}>
      <header style={{ borderBottom: '1px solid var(--lavender-100)' }}>
        <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/api4cheap-logo.svg" alt="Api4Cheap" style={{ height: '36px', width: '36px', borderRadius: '8px' }} />
            <span className="brand-text-effect" style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 500 }}>Api4Cheap</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <Link href="/login" className="btn-ghost" style={{ fontSize: '14px' }}>Đăng nhập</Link>
            <Link href="/register" className="btn-primary" style={{ fontSize: '14px' }}>Bắt đầu</Link>
          </nav>
        </div>
      </header>

      <section className="container-main" style={{ paddingTop: '60px', paddingBottom: '60px', textAlign: 'center', paddingLeft: '20px', paddingRight: '20px' }}>
        <div className="badge-secondary" style={{ margin: '0 auto 24px', width: 'fit-content' }}>
          <Sparkles style={{ height: '14px', width: '14px' }} /> Cổng Api4Cheap
        </div>
        <h1 className="display-xl" style={{ maxWidth: '760px', margin: '0 auto', fontSize: 'clamp(28px, 5vw, 48px)' }}>
          Claude Code và Codex CLI
        </h1>
        <h1 className="display-xl" style={{ color: 'var(--brand-orange)', marginTop: '4px', fontSize: 'clamp(28px, 5vw, 48px)' }}>
          trên một API key
        </h1>
        <p className="body-lg" style={{ color: 'var(--stone-600)', marginTop: '24px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', fontSize: 'clamp(14px, 2.5vw, 18px)' }}>
          Api4Cheap được cấu hình sẵn cho hai workflow coding chính: Claude Code và Codex CLI. Base URL hiện tại: {publicOrigin || 'đang tự nhận diện'}.
        </p>
        <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          <Link href="/register" className="btn-cta" style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
            Tạo tài khoản <ArrowRight style={{ height: '18px', width: '18px' }} />
          </Link>
          <Link href="/dashboard/docs" className="btn-secondary" style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
            Xem thiết lập nhanh
          </Link>
        </div>
      </section>

      <section className="container-main" style={{ paddingBottom: '48px', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1px', background: 'var(--lavender-100)', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            { value: '2', label: 'Client được hỗ trợ' },
            { value: '5h', label: 'Cửa sổ cuộn chiếu' },
            { value: '99.9%', label: 'Mục tiêu uptime' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'white', padding: '24px 16px', textAlign: 'center' }} className="dark:!bg-[#1A1A19]">
              <div className="display-md" style={{ color: 'var(--brand-orange)', fontSize: 'clamp(20px, 4vw, 32px)' }}>{s.value}</div>
              <div className="body-sm" style={{ color: 'var(--stone-600)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-main" style={{ paddingBottom: '60px', paddingLeft: '20px', paddingRight: '20px' }}>
        <h2 className="display-md" style={{ textAlign: 'center', marginBottom: '40px', fontSize: 'clamp(22px, 4vw, 32px)' }}>Xây dựng cho coding agent</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={f.title} className="card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '8px', background: 'var(--cream-50)', marginBottom: '16px' }}>
                <f.icon style={{ height: '20px', width: '20px', color: 'var(--brand-orange)' }} />
              </div>
              <h3 className="heading-5" style={{ marginBottom: '8px' }}>{f.title}</h3>
              <p className="body-sm" style={{ color: 'var(--stone-600)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--cream-50)', padding: '60px 0' }}>
        <div className="container-main" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <h2 className="display-md" style={{ textAlign: 'center', marginBottom: '40px', fontSize: 'clamp(22px, 4vw, 32px)' }}>Bắt đầu trong 3 bước</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {steps.map((s) => (
              <div key={s.num} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 500, color: 'var(--brand-orange)', lineHeight: 1 }}>{s.num}</span>
                <div>
                  <h3 className="heading-5">{s.title}</h3>
                  <p className="body-sm" style={{ color: 'var(--stone-600)', marginTop: '4px' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-main" style={{ padding: '60px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'start' }}>
          <div>
            <h2 className="display-md" style={{ marginBottom: '16px', fontSize: 'clamp(22px, 4vw, 32px)' }}>Chỉ hỗ trợ Claude Code và Codex CLI</h2>
            <p className="body" style={{ color: 'var(--stone-600)', marginBottom: '24px' }}>
              Tài liệu dashboard, script thiết lập và ví dụ gateway chỉ tập trung vào hai client được hỗ trợ.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Claude Code', 'Codex CLI'].map((t) => (
                <span key={t} className="badge-secondary">{t}</span>
              ))}
            </div>
          </div>
          <div className="card-code">
            <div className="caption" style={{ color: '#629987', marginBottom: '8px' }}>Nhà cung cấp cho Codex</div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '20px' }}>{`model_provider = "api4cheap"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "${codexBaseUrl}"
wire_api = "responses"`}</pre>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ background: 'var(--cream-50)', padding: '60px 0' }}>
        <div className="container-main" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <h2 className="display-md" style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)' }}>Bảng giá</h2>
          <p className="body" style={{ color: 'var(--stone-600)', textAlign: 'center', marginTop: '8px' }}>Tất cả gói đều đặt lại theo cửa sổ cuộn chiếu.</p>
          <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {plans.map((p) => (
              <div key={p.name} className="card" style={{ position: 'relative', borderColor: p.highlight ? 'var(--brand-orange)' : undefined, boxShadow: p.highlight ? 'var(--shadow-elevated)' : undefined }}>
                {p.highlight && <span className="badge-primary" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)' }}>Phổ biến</span>}
                <h3 className="heading-5">{p.name}</h3>
                <div style={{ marginTop: '16px' }}>
                  <span className="display-md" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>{p.price}</span>
                  <span className="body-sm" style={{ color: 'var(--stone-600)' }}> / tháng</span>
                </div>
                <div style={{ marginTop: '8px' }} className="body-sm"><b>{p.tokens}</b> token / {p.windowHours}h</div>
                <ul style={{ marginTop: '16px', listStyle: 'none', padding: 0 }}>
                  {p.models.map((m) => (
                    <li key={m} className="body-sm" style={{ padding: '4px 0', color: 'var(--stone-600)' }}>Hỗ trợ {m}</li>
                  ))}
                </ul>
                <Link href="/register" className={`${p.highlight ? 'btn-cta' : 'btn-primary'}`} style={{ width: '100%', marginTop: '24px' }}>
                  Chọn {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-main" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 className="display-md" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>Sẵn sàng cấu hình?</h2>
        <p className="body" style={{ color: 'var(--stone-600)', marginTop: '8px' }}>Tạo API key, sau đó chạy script thiết lập cho Claude Code hoặc Codex CLI.</p>
        <Link href="/register" className="btn-cta" style={{ marginTop: '24px', fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
          Bắt đầu ngay <ArrowRight style={{ height: '18px', width: '18px' }} />
        </Link>
      </section>

      <footer style={{ borderTop: '1px solid var(--lavender-100)', padding: '24px 20px', textAlign: 'center' }}>
        <span className="caption">Bản quyền {new Date().getFullYear()} Api4Cheap - cổng cho Claude Code và Codex CLI</span>
      </footer>
    </main>
  );
}
