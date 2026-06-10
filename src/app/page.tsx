import Link from 'next/link';
import { ArrowRight, Code2, RefreshCw, Shield, Sparkles, Terminal } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { prisma } from '@/lib/prisma';
import { formatNumber, formatVND } from '@/lib/utils';
import { parseModelIds } from '@/lib/json';
import { getPublicOrigin } from '@/lib/public-url';

const steps = [
  { num: '01', title: 'Táº¡o tÃ i khoáº£n', desc: 'ÄÄƒng kÃ½ rá»“i má»Ÿ dashboard.' },
  { num: '02', title: 'Táº¡o API key', desc: 'VÃ o má»¥c API key vÃ  táº¡o secret má»›i.' },
  { num: '03', title: 'Cháº¡y thiáº¿t láº­p nhanh', desc: 'Chá»n Claude Code hoáº·c Codex CLI rá»“i cháº¡y lá»‡nh cÃ i Ä‘áº·t.' },
];

export default async function HomePage() {
  const publicOrigin = getPublicOrigin();
  const claudeBaseUrl = publicOrigin || 'https://your-domain';
  const codexBaseUrl = publicOrigin ? `${publicOrigin}/v1` : 'https://your-domain/v1';
  const features = [
    {
      icon: Terminal,
      title: 'Sáºµn sÃ ng cho Claude Code',
      desc: `DÃ¹ng ANTHROPIC_BASE_URL=${claudeBaseUrl} cÃ¹ng key Api4Cheap cá»§a báº¡n.`,
    },
    {
      icon: Code2,
      title: 'Sáºµn sÃ ng cho Codex CLI',
      desc: `DÃ¹ng provider api4cheap, Responses API vÃ  base URL ${codexBaseUrl}.`,
    },
    {
      icon: RefreshCw,
      title: 'Háº¡n má»©c cuá»™n chiáº¿u',
      desc: 'GÃ³i dá»‹ch vá»¥ tá»± Ä‘áº·t láº¡i theo cá»­a sá»• thá»i gian, giÃºp phiÃªn coding dÃ i khÃ´ng bá»‹ giÃ¡n Ä‘oáº¡n.',
    },
    {
      icon: Shield,
      title: 'Theo dÃµi minh báº¡ch',
      desc: 'Má»©c dÃ¹ng Ä‘Æ°á»£c tÃ­nh tá»« token upstream Ä‘á»ƒ giá»›i háº¡n luÃ´n rÃµ rÃ ng.',
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
            <Link href="/login" className="btn-ghost" style={{ fontSize: '14px' }}>ÄÄƒng nháº­p</Link>
            <Link href="/register" className="btn-primary" style={{ fontSize: '14px' }}>Báº¯t Ä‘áº§u</Link>
          </nav>
        </div>
      </header>

      <section className="container-main" style={{ paddingTop: '60px', paddingBottom: '60px', textAlign: 'center', paddingLeft: '20px', paddingRight: '20px' }}>
        <div className="badge-secondary" style={{ margin: '0 auto 24px', width: 'fit-content' }}>
          <Sparkles style={{ height: '14px', width: '14px' }} /> Cá»•ng Api4Cheap
        </div>
        <h1 className="display-xl" style={{ maxWidth: '760px', margin: '0 auto', fontSize: 'clamp(28px, 5vw, 48px)' }}>
          Claude Code vÃ  Codex CLI
        </h1>
        <h1 className="display-xl" style={{ color: 'var(--brand-orange)', marginTop: '4px', fontSize: 'clamp(28px, 5vw, 48px)' }}>
          trÃªn má»™t API key
        </h1>
        <p className="body-lg" style={{ color: 'var(--stone-600)', marginTop: '24px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', fontSize: 'clamp(14px, 2.5vw, 18px)' }}>
          Api4Cheap Ä‘Æ°á»£c cáº¥u hÃ¬nh sáºµn cho hai workflow coding chÃ­nh: Claude Code vÃ  Codex CLI. Base URL hiá»‡n táº¡i: {publicOrigin || 'Ä‘ang tá»± nháº­n diá»‡n'}.
        </p>
        <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          <Link href="/register" className="btn-cta" style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
            Táº¡o tÃ i khoáº£n <ArrowRight style={{ height: '18px', width: '18px' }} />
          </Link>
          <Link href="/dashboard/docs" className="btn-secondary" style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
            Xem thiáº¿t láº­p nhanh
          </Link>
        </div>
      </section>

      <section className="container-main" style={{ paddingBottom: '48px', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1px', background: 'var(--lavender-100)', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            { value: '2', label: 'Client Ä‘Æ°á»£c há»— trá»£' },
            { value: '5h', label: 'Cá»­a sá»• cuá»™n chiáº¿u' },
            { value: '99.9%', label: 'Má»¥c tiÃªu uptime' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'white', padding: '24px 16px', textAlign: 'center' }} className="dark:!bg-[#1A1A19]">
              <div className="display-md" style={{ color: 'var(--brand-orange)', fontSize: 'clamp(20px, 4vw, 32px)' }}>{s.value}</div>
              <div className="body-sm" style={{ color: 'var(--stone-600)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-main" style={{ paddingBottom: '60px', paddingLeft: '20px', paddingRight: '20px' }}>
        <h2 className="display-md" style={{ textAlign: 'center', marginBottom: '40px', fontSize: 'clamp(22px, 4vw, 32px)' }}>XÃ¢y dá»±ng cho coding agent</h2>
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
          <h2 className="display-md" style={{ textAlign: 'center', marginBottom: '40px', fontSize: 'clamp(22px, 4vw, 32px)' }}>Báº¯t Ä‘áº§u trong 3 bÆ°á»›c</h2>
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
            <h2 className="display-md" style={{ marginBottom: '16px', fontSize: 'clamp(22px, 4vw, 32px)' }}>Chá»‰ há»— trá»£ Claude Code vÃ  Codex CLI</h2>
            <p className="body" style={{ color: 'var(--stone-600)', marginBottom: '24px' }}>
              TÃ i liá»‡u dashboard, script thiáº¿t láº­p vÃ  vÃ­ dá»¥ gateway chá»‰ táº­p trung vÃ o hai client Ä‘Æ°á»£c há»— trá»£.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Claude Code', 'Codex CLI'].map((t) => (
                <span key={t} className="badge-secondary">{t}</span>
              ))}
            </div>
          </div>
          <div className="card-code">
            <div className="caption" style={{ color: '#629987', marginBottom: '8px' }}>NhÃ  cung cáº¥p cho Codex</div>
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
          <h2 className="display-md" style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)' }}>Báº£ng giÃ¡</h2>
          <p className="body" style={{ color: 'var(--stone-600)', textAlign: 'center', marginTop: '8px' }}>Táº¥t cáº£ gÃ³i Ä‘á»u Ä‘áº·t láº¡i theo cá»­a sá»• cuá»™n chiáº¿u.</p>
          <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {plans.map((p) => (
              <div key={p.name} className="card" style={{ position: 'relative', borderColor: p.highlight ? 'var(--brand-orange)' : undefined, boxShadow: p.highlight ? 'var(--shadow-elevated)' : undefined }}>
                {p.highlight && <span className="badge-primary" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)' }}>Phá»• biáº¿n</span>}
                <h3 className="heading-5">{p.name}</h3>
                <div style={{ marginTop: '16px' }}>
                  <span className="display-md" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>{p.price}</span>
                  <span className="body-sm" style={{ color: 'var(--stone-600)' }}> / thÃ¡ng</span>
                </div>
                <div style={{ marginTop: '8px' }} className="body-sm"><b>{p.tokens}</b> token / {p.windowHours}h</div>
                <ul style={{ marginTop: '16px', listStyle: 'none', padding: 0 }}>
                  {p.models.map((m) => (
                    <li key={m} className="body-sm" style={{ padding: '4px 0', color: 'var(--stone-600)' }}>Há»— trá»£ {m}</li>
                  ))}
                </ul>
                <Link href="/register" className={`${p.highlight ? 'btn-cta' : 'btn-primary'}`} style={{ width: '100%', marginTop: '24px' }}>
                  Chá»n {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-main" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 className="display-md" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>Sáºµn sÃ ng cáº¥u hÃ¬nh?</h2>
        <p className="body" style={{ color: 'var(--stone-600)', marginTop: '8px' }}>Táº¡o API key, sau Ä‘Ã³ cháº¡y script thiáº¿t láº­p cho Claude Code hoáº·c Codex CLI.</p>
        <Link href="/register" className="btn-cta" style={{ marginTop: '24px', fontSize: 'clamp(14px, 2.5vw, 17px)', padding: '12px 24px' }}>
          Báº¯t Ä‘áº§u ngay <ArrowRight style={{ height: '18px', width: '18px' }} />
        </Link>
      </section>

      <footer style={{ borderTop: '1px solid var(--lavender-100)', padding: '24px 20px', textAlign: 'center' }}>
        <span className="caption">Báº£n quyá»n {new Date().getFullYear()} Api4Cheap - cá»•ng cho Claude Code vÃ  Codex CLI</span>
      </footer>
    </main>
  );
}
