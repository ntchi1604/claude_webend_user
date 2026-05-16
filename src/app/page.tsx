import Link from 'next/link';
import { ArrowRight, Shield, Code2, RefreshCw, Terminal, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { prisma } from '@/lib/prisma';
import { formatNumber, formatVND } from '@/lib/utils';
import { parseModelIds } from '@/lib/json';

const features = [
  { icon: Code2, title: 'OpenAI Compatible', desc: 'Cắm thẳng vào Cursor, Cline, Continue, Roo Code. Một key duy nhất.' },
  { icon: Terminal, title: 'Anthropic Native', desc: 'Hỗ trợ /v1/messages cho Claude Code, SDK Anthropic.' },
  { icon: RefreshCw, title: 'Quota Rolling', desc: 'Mô hình cuốn chiếu — không lo nghẽn cả ngày.' },
  { icon: Shield, title: 'Token Chính Xác', desc: 'Đếm chính xác từ upstream, không ước lượng.' }
];

const steps = [
  { num: '01', title: 'Đăng ký', desc: 'Tạo tài khoản miễn phí, nhận tokens ngay.' },
  { num: '02', title: 'Tạo API Key', desc: 'Vào Dashboard → API Keys → Tạo key mới.' },
  { num: '03', title: 'Cắm vào IDE', desc: 'Paste Base URL + Key vào Cursor, Cline, Claude Code.' }
];

export default async function HomePage() {
  const dbPlans = await prisma.plan.findMany({ where: { enabled: true }, orderBy: { priceVND: 'asc' } });
  const models = await prisma.model.findMany();
  const modelMap = new Map(models.map((m) => [m.id, m.name]));

  const plans = dbPlans.map((p, i) => ({
    name: p.name,
    tokens: formatNumber(Number(p.tokenLimit)),
    price: formatVND(p.priceVND),
    windowHours: p.windowHours,
    models: parseModelIds(p.modelIds).map((id) => modelMap.get(id)).filter((n): n is string => !!n),
    highlight: i === Math.min(2, dbPlans.length - 1)
  }));
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream-100)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--lavender-100)' }}>
        <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <span style={{ display: 'inline-flex', height: '36px', width: '36px', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'var(--brand-orange)', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500 }}>A</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 500 }}>Api4Cheap</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <Link href="/login" className="btn-ghost" style={{ fontSize: '14px' }}>Đăng nhập</Link>
            <Link href="/register" className="btn-primary" style={{ fontSize: '14px' }}>Bắt đầu</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container-main" style={{ paddingTop: '60px', paddingBottom: '60px', textAlign: 'center', paddingLeft: '20px', paddingRight: '20px' }}>
        <div className="badge-secondary" style={{ margin: '0 auto 24px', width: 'fit-content' }}>
          <Sparkles style={{ height: '14px', width: '14px' }} /> AI API Gateway giá rẻ
        </div>
        <h1 className="display-xl" style={{ maxWidth: '700px', margin: '0 auto', fontSize: 'clamp(28px, 5vw, 48px)' }}>
          Claude & GPT API
        </h1>
        <h1 className="display-xl" style={{ color: 'var(--brand-orange)', marginTop: '4px', fontSize: 'clamp(28px, 5vw, 48px)' }}>
          theo gói, giá rẻ
        </h1>
        <p className="body-lg" style={{ color: 'var(--stone-600)', marginTop: '24px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', fontSize: 'clamp(14px, 2.5vw, 18px)' }}>
          Cắm vào Cursor, Cline, Claude Code. Một API key duy nhất, tương thích OpenAI & Anthropic, giá rẻ hơn nhiều lần.
        </p>
        <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          <Link href="/register" className="btn-cta" style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
            Tạo tài khoản miễn phí <ArrowRight style={{ height: '18px', width: '18px' }} />
          </Link>
          <Link href="/dashboard/docs" className="btn-secondary" style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>Xem tài liệu</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="container-main" style={{ paddingBottom: '48px', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1px', background: 'var(--lavender-100)', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            { value: '40+', label: 'AI Models' },
            { value: '5h', label: 'Rolling Window' },
            { value: '99.9%', label: 'Uptime' }
          ].map((s) => (
            <div key={s.label} style={{ background: 'white', padding: '24px 16px', textAlign: 'center' }} className="dark:!bg-[#1A1A19]">
              <div className="display-md" style={{ color: 'var(--brand-orange)', fontSize: 'clamp(20px, 4vw, 32px)' }}>{s.value}</div>
              <div className="body-sm" style={{ color: 'var(--stone-600)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container-main" style={{ paddingBottom: '60px', paddingLeft: '20px', paddingRight: '20px' }}>
        <h2 className="display-md" style={{ textAlign: 'center', marginBottom: '40px', fontSize: 'clamp(22px, 4vw, 32px)' }}>Tại sao chọn Api4Cheap?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '8px', background: 'var(--cream-50)', marginBottom: '16px' }}>
                <f.icon style={{ height: '20px', width: '20px', color: 'var(--brand-orange)' }} />
              </div>
              <h3 className="heading-5" style={{ marginBottom: '8px' }}>{f.title}</h3>
              <p className="body-sm" style={{ color: 'var(--stone-600)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
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

      {/* Code example */}
      <section className="container-main" style={{ padding: '60px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
          <div>
            <h2 className="display-md" style={{ marginBottom: '16px', fontSize: 'clamp(22px, 4vw, 32px)' }}>Tương thích hoàn toàn</h2>
            <p className="body" style={{ color: 'var(--stone-600)', marginBottom: '24px' }}>
              Drop-in replacement cho OpenAI API. Chỉ cần đổi Base URL và API key — code không cần sửa gì.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Cursor', 'Cline', 'Continue', 'Claude Code', 'Roo Code', 'Antigravity'].map((t) => (
                <span key={t} className="badge-secondary">{t}</span>
              ))}
            </div>
          </div>
          <div className="card-code">
            <div className="caption" style={{ color: '#629987', marginBottom: '8px' }}>$ curl api4cheap/v1/chat/completions</div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '20px' }}>{`{
  "model": "claude-sonnet-4-5",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true
}`}</pre>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: 'var(--cream-50)', padding: '60px 0' }}>
        <div className="container-main" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <h2 className="display-md" style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)' }}>Gói cước</h2>
          <p className="body" style={{ color: 'var(--stone-600)', textAlign: 'center', marginTop: '8px' }}>Tất cả gói reset theo rolling window — không lo hết hạn cả ngày.</p>
          <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {plans.map((p) => (
              <div key={p.name} className="card" style={{ position: 'relative', borderColor: p.highlight ? 'var(--brand-orange)' : undefined, boxShadow: p.highlight ? 'var(--shadow-elevated)' : undefined }}>
                {p.highlight && <span className="badge-primary" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50)' }}>Phổ biến</span>}
                <h3 className="heading-5">{p.name}</h3>
                <div style={{ marginTop: '16px' }}>
                  <span className="display-md" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>{p.price}</span>
                  <span className="body-sm" style={{ color: 'var(--stone-600)' }}> / tháng</span>
                </div>
                <div style={{ marginTop: '8px' }} className="body-sm"><b>{p.tokens}</b> tokens / {p.windowHours}h</div>
                <ul style={{ marginTop: '16px', listStyle: 'none', padding: 0 }}>
                  {p.models.map((m) => (
                    <li key={m} className="body-sm" style={{ padding: '4px 0', color: 'var(--stone-600)' }}>✓ {m}</li>
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

      {/* CTA */}
      <section className="container-main" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 className="display-md" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>Sẵn sàng bắt đầu?</h2>
        <p className="body" style={{ color: 'var(--stone-600)', marginTop: '8px' }}>Tạo tài khoản miễn phí, nhận tokens ngay.</p>
        <Link href="/register" className="btn-cta" style={{ marginTop: '24px', fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
          Bắt đầu ngay <ArrowRight style={{ height: '18px', width: '18px' }} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--lavender-100)', padding: '24px 20px', textAlign: 'center' }}>
        <span className="caption">© {new Date().getFullYear()} Api4Cheap · OpenAI & Anthropic-compatible AI gateway</span>
      </footer>
    </main>
  );
}
