import Link from 'next/link';
import { ArrowRight, Zap, Shield, Code2, RefreshCw, Terminal, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';

const features = [
  { icon: Code2, title: 'OpenAI Compatible', desc: 'Cắm thẳng vào Cursor, Cline, Continue, Roo Code. Một key duy nhất.' },
  { icon: Terminal, title: 'Anthropic Native', desc: 'Hỗ trợ /v1/messages cho Claude Code, SDK Anthropic.' },
  { icon: RefreshCw, title: 'Quota Rolling 5h', desc: 'Mô hình cuốn chiếu — không lo nghẽn cả ngày.' },
  { icon: Shield, title: 'Token Chính Xác', desc: 'Đếm bằng tiktoken, ưu tiên usage từ upstream.' }
];

const plans = [
  { name: 'Free', tokens: '50K', price: '0đ', models: ['gpt-4o-mini'], highlight: false },
  { name: 'Basic', tokens: '500K', price: '99.000đ', models: ['gpt-4o-mini', 'gpt-4o', 'claude-haiku'], highlight: false },
  { name: 'Pro', tokens: '2M', price: '299.000đ', models: ['gpt-4o-mini', 'gpt-4o', 'claude-haiku', 'claude-sonnet'], highlight: true },
  { name: 'Max', tokens: '10M', price: '799.000đ', models: ['Tất cả models', 'Priority support'], highlight: false }
];

const steps = [
  { num: '01', title: 'Đăng ký', desc: 'Tạo tài khoản miễn phí, nhận 50K tokens.' },
  { num: '02', title: 'Tạo API Key', desc: 'Vào Dashboard → API Keys → Tạo key mới.' },
  { num: '03', title: 'Cắm vào IDE', desc: 'Paste Base URL + Key vào Cursor, Cline, Claude Code.' }
];

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream-100)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--lavender-100)' }}>
        <div className="container-main flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--brand-orange)', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500 }}>C</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 500 }}>ClaudeWebEnd</span>
          </Link>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost">Đăng nhập</Link>
            <Link href="/register" className="btn-primary">Bắt đầu</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container-main" style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
        <div className="badge-secondary" style={{ margin: '0 auto 24px', width: 'fit-content' }}>
          <Sparkles style={{ height: '14px', width: '14px' }} /> Powered by 40+ providers via 9router
        </div>
        <h1 className="display-xl" style={{ maxWidth: '700px', margin: '0 auto' }}>
          Claude & GPT API
        </h1>
        <h1 className="display-xl" style={{ color: 'var(--brand-orange)', marginTop: '4px' }}>
          theo gói, reset 5 giờ
        </h1>
        <p className="body-lg" style={{ color: 'var(--stone-600)', marginTop: '24px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
          Cắm vào Cursor, Cline, Claude Code. Một API key duy nhất, tương thích OpenAI & Anthropic, giá rẻ hơn nhiều lần.
        </p>
        <div style={{ marginTop: '40px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          <Link href="/register" className="btn-cta" style={{ fontSize: '17px', padding: '14px 28px' }}>
            Tạo tài khoản miễn phí <ArrowRight style={{ height: '18px', width: '18px' }} />
          </Link>
          <Link href="/dashboard/docs" className="btn-secondary" style={{ fontSize: '17px', padding: '14px 28px' }}>Xem tài liệu</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="container-main" style={{ paddingBottom: '64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--lavender-100)', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            { value: '40+', label: 'AI Providers' },
            { value: '5h', label: 'Rolling Window' },
            { value: '99.9%', label: 'Uptime' }
          ].map((s) => (
            <div key={s.label} style={{ background: 'white', padding: '32px', textAlign: 'center' }} className="dark:!bg-[#1A1A19]">
              <div className="display-md" style={{ color: 'var(--brand-orange)' }}>{s.value}</div>
              <div className="body-sm" style={{ color: 'var(--stone-600)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container-main" style={{ paddingBottom: '80px' }}>
        <h2 className="display-md" style={{ textAlign: 'center', marginBottom: '48px' }}>Tại sao chọn ClaudeWebEnd?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
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
      <section style={{ background: 'var(--cream-50)', padding: '80px 0' }}>
        <div className="container-main">
          <h2 className="display-md" style={{ textAlign: 'center', marginBottom: '48px' }}>Bắt đầu trong 3 bước</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {steps.map((s) => (
              <div key={s.num} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, color: 'var(--brand-orange)', lineHeight: 1 }}>{s.num}</span>
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
      <section className="container-main" style={{ padding: '80px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }} className="max-lg:!grid-cols-1">
          <div>
            <h2 className="display-md" style={{ marginBottom: '16px' }}>Tương thích hoàn toàn</h2>
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
            <div className="caption" style={{ color: '#629987', marginBottom: '8px' }}>$ curl your-domain.com/v1/chat/completions</div>
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
      <section id="pricing" style={{ background: 'var(--cream-50)', padding: '80px 0' }}>
        <div className="container-main">
          <h2 className="display-md" style={{ textAlign: 'center' }}>Gói cước</h2>
          <p className="body" style={{ color: 'var(--stone-600)', textAlign: 'center', marginTop: '8px' }}>Tất cả gói reset mỗi 5 giờ — không lo hết hạn cả ngày.</p>
          <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {plans.map((p) => (
              <div key={p.name} className="card" style={{ position: 'relative', borderColor: p.highlight ? 'var(--brand-orange)' : undefined, boxShadow: p.highlight ? 'var(--shadow-elevated)' : undefined }}>
                {p.highlight && <span className="badge-primary" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)' }}>Phổ biến</span>}
                <h3 className="heading-5">{p.name}</h3>
                <div style={{ marginTop: '16px' }}>
                  <span className="display-md">{p.price}</span>
                  <span className="body-sm" style={{ color: 'var(--stone-600)' }}> / tháng</span>
                </div>
                <div style={{ marginTop: '8px' }} className="body-sm"><b>{p.tokens}</b> tokens / 5h</div>
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
      <section className="container-main" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 className="display-md">Sẵn sàng bắt đầu?</h2>
        <p className="body" style={{ color: 'var(--stone-600)', marginTop: '8px' }}>Tạo tài khoản miễn phí, nhận 50K tokens ngay.</p>
        <Link href="/register" className="btn-cta" style={{ marginTop: '24px', fontSize: '17px', padding: '14px 28px' }}>
          Bắt đầu ngay <ArrowRight style={{ height: '18px', width: '18px' }} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--lavender-100)', padding: '24px 0', textAlign: 'center' }}>
        <span className="caption">© {new Date().getFullYear()} ClaudeWebEnd · OpenAI & Anthropic-compatible AI gateway</span>
      </footer>
    </main>
  );
}
