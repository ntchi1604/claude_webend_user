'use client';
import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Terminal, Monitor, Apple } from 'lucide-react';

type Tool = 'claude-code' | 'cursor' | 'openclaw' | 'codex-cli' | 'hermes-agent';

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'claude-code', label: 'Claude Code', icon: '✦' },
  { id: 'cursor', label: 'Cursor / Cline', icon: '⚡' },
  { id: 'openclaw', label: 'OpenClaw', icon: '🐾' },
  { id: 'codex-cli', label: 'Codex CLI', icon: '📟' },
  { id: 'hermes-agent', label: 'Hermes', icon: '🪽' },
];

export default function DocsPage() {
  const base = 'https://lccaptcha.io.vn';

  const [tool, setTool] = useState<Tool>('claude-code');
  const [os, setOs] = useState<'windows' | 'mac'>('windows');
  const [selectedKey, setSelectedKey] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [haiku, setHaiku] = useState('');
  const [sonnet, setSonnet] = useState('');
  const [opus, setOpus] = useState('');
  const [cursorModel, setCursorModel] = useState('');
  const [openclawSmall, setOpenclawSmall] = useState('');
  const [openclawMedium, setOpenclawMedium] = useState('');
  const [openclawHigh, setOpenclawHigh] = useState('');
  const [codexSmall, setCodexSmall] = useState('');
  const [codexMedium, setCodexMedium] = useState('');
  const [codexLarge, setCodexLarge] = useState('');
  const [hermesModel, setHermesModel] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(d => {
      const m = (d.models || d || []).map((x: any) => x.name || x.id || x);
      setModels(m);
      if (m.length > 0) {
        // Auto-select defaults
        const s = m.find((x: string) => x.includes('sonnet')) || m[0];
        const h = m.find((x: string) => x.includes('haiku')) || '';
        const o = m.find((x: string) => x.includes('opus')) || '';
        setSonnet(s);
        setHaiku(h);
        setOpus(o);
        setCursorModel(s);
      }
    }).catch(() => {});
  }, []);

  const getSetupCommand = useCallback(() => {
    const key = selectedKey || 'sk-cw-xxxx';
    if (tool === 'claude-code') {
      const params = new URLSearchParams({ key, os });
      if (haiku) params.set('haiku', haiku);
      if (sonnet) params.set('sonnet', sonnet);
      if (opus) params.set('opus', opus);
      const url = `${base}/api/setup/claude-code?${params.toString()}`;
      if (os === 'windows') {
        return `irm "${url}" | iex`;
      } else {
        return `curl -fsSL "${url}" | bash`;
      }
    }
    if (tool === 'openclaw') {
      const params = new URLSearchParams({ key, os });
      if (openclawSmall) params.set('small', openclawSmall);
      if (openclawMedium) params.set('medium', openclawMedium);
      if (openclawHigh) params.set('high', openclawHigh);
      const url = `${base}/api/setup/openclaw?${params.toString()}`;
      if (os === 'windows') {
        return `irm "${url}" | iex`;
      } else {
        return `curl -fsSL "${url}" | bash`;
      }
    }
    if (tool === 'codex-cli') {
      const params = new URLSearchParams({ key, os });
      if (codexSmall) params.set('small', codexSmall);
      if (codexMedium) params.set('medium', codexMedium);
      if (codexLarge) params.set('large', codexLarge);
      const url = `${base}/api/setup/codex-cli?${params.toString()}`;
      if (os === 'windows') {
        return `irm "${url}" | iex`;
      } else {
        return `curl -fsSL "${url}" | bash`;
      }
    }
    if (tool === 'hermes-agent') {
      const params = new URLSearchParams({ key, os });
      if (hermesModel) params.set('model', hermesModel);
      const url = `${base}/api/setup/hermes-agent?${params.toString()}`;
      if (os === 'windows') {
        return `irm "${url}" | iex`;
      } else {
        return `curl -fsSL "${url}" | bash`;
      }
    }
    // Cursor/Cline — just show config
    return '';
  }, [tool, os, selectedKey, haiku, sonnet, opus, cursorModel, base, openclawSmall, openclawMedium, openclawHigh, codexSmall, codexMedium, codexLarge, hermesModel]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setupCmd = getSetupCommand();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="heading-1">Cấu hình API Key</h1>
        <p className="body-sm text-[var(--stone-600)] mt-1">Thiết lập nhanh cho công cụ AI hoặc cấu hình thủ công.</p>
      </div>

      {/* Tool tabs */}
      <div className="card">
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--cream-50)] mb-6">
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-[14px] font-medium transition-all ${
                tool === t.id
                  ? 'bg-white dark:bg-[#2a2a29] shadow-sm text-[var(--charcoal-900)]'
                  : 'text-[var(--stone-600)] hover:text-[var(--charcoal-900)]'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* API Key input */}
        <div className="mb-4">
          <label className="form-label">API Key</label>
          <input
            type="text"
            value={selectedKey}
            onChange={e => setSelectedKey(e.target.value)}
            placeholder="sk-cw-xxxx"
            className="input"
          />
          <p className="caption mt-1">Paste API Key đầy đủ từ trang API Keys.</p>
        </div>

        {/* OS toggle (for claude-code) */}
        {tool === 'claude-code' && (
          <>
            <div className="mb-4">
              <label className="form-label">Hệ điều hành</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOs('windows')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'windows'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Monitor className="h-4 w-4" /> Windows
                </button>
                <button
                  onClick={() => setOs('mac')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'mac'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Apple className="h-4 w-4" /> macOS / Linux
                </button>
              </div>
            </div>

            {/* Model selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="form-label">Haiku (fast)</label>
                <select value={haiku} onChange={e => setHaiku(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Sonnet (default)</label>
                <select value={sonnet} onChange={e => setSonnet(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Opus (powerful)</label>
                <select value={opus} onChange={e => setOpus(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Setup command */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="label flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> Lệnh cài đặt</span>
                <button
                  onClick={() => copyToClipboard(setupCmd)}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--brand-blue)] hover:underline cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Đã copy' : 'Copy'}
                </button>
              </div>
              <div className="card-code">
                <code className="text-[13px] break-all leading-6">{setupCmd}</code>
              </div>
              <div className="mt-3 space-y-1">
                <p className="caption">Hướng dẫn:</p>
                <p className="caption">1. Copy lệnh ở trên</p>
                <p className="caption">2. Mở <b>{os === 'windows' ? 'PowerShell' : 'Terminal'}</b>, dán lệnh và nhấn Enter</p>
                <p className="caption">3. Sau đó chạy: <code className="font-mono text-[12px] bg-[var(--cream-50)] px-1 rounded">claude</code></p>
              </div>
            </div>
          </>
        )}

        {/* Cursor / Cline config */}
        {tool === 'cursor' && (
          <div>
            <div className="mb-4">
              <label className="form-label">Model</label>
              <select value={cursorModel} onChange={e => setCursorModel(e.target.value)} className="input">
                <option value="">Chọn model...</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="card-code">
              <div className="space-y-1 text-[13px]">
                <div><span style={{ color: '#629987' }}>Provider:</span> OpenAI Compatible</div>
                <div><span style={{ color: '#629987' }}>Base URL:</span> {base}/v1</div>
                <div><span style={{ color: '#629987' }}>API Key:</span>  {selectedKey || 'sk-cw-xxxx'}</div>
                <div><span style={{ color: '#629987' }}>Model:</span>   {cursorModel || 'claude-sonnet-4-5'}</div>
              </div>
            </div>
            <p className="caption mt-3">Paste thông tin trên vào Settings của Cursor / Cline / Continue / Roo Code.</p>
          </div>
        )}

        {/* OpenClaw */}
        {tool === 'openclaw' && (
          <>
            <div className="mb-4">
              <label className="form-label">Hệ điều hành</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOs('windows')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'windows'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Monitor className="h-4 w-4" /> Windows
                </button>
                <button
                  onClick={() => setOs('mac')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'mac'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Apple className="h-4 w-4" /> macOS / Linux
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="form-label">Small</label>
                <select value={openclawSmall} onChange={e => setOpenclawSmall(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Medium</label>
                <select value={openclawMedium} onChange={e => setOpenclawMedium(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">High</label>
                <select value={openclawHigh} onChange={e => setOpenclawHigh(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="label flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> Lệnh cài đặt</span>
                <button
                  onClick={() => copyToClipboard(setupCmd)}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--brand-blue)] hover:underline cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Đã copy' : 'Copy'}
                </button>
              </div>
              <div className="card-code">
                <code className="text-[13px] break-all leading-6">{setupCmd}</code>
              </div>
              <div className="mt-3 space-y-1">
                <p className="caption">Hướng dẫn:</p>
                <p className="caption">1. Copy lệnh ở trên</p>
                <p className="caption">2. Mở <b>{os === 'windows' ? 'PowerShell' : 'Terminal'}</b>, dán lệnh và nhấn Enter</p>
                <p className="caption">3. Sau đó chạy: <code className="font-mono text-[12px] bg-[var(--cream-50)] px-1 rounded">openclaw</code></p>
              </div>
            </div>
          </>
        )}

        {/* Codex CLI */}
        {tool === 'codex-cli' && (
          <>
            <div className="mb-4">
              <label className="form-label">Hệ điều hành</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOs('windows')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'windows'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Monitor className="h-4 w-4" /> Windows
                </button>
                <button
                  onClick={() => setOs('mac')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'mac'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Apple className="h-4 w-4" /> macOS / Linux
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="form-label">Small</label>
                <select value={codexSmall} onChange={e => setCodexSmall(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Medium</label>
                <select value={codexMedium} onChange={e => setCodexMedium(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Large</label>
                <select value={codexLarge} onChange={e => setCodexLarge(e.target.value)} className="input">
                  <option value="">Không dùng</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="label flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> Lệnh cài đặt</span>
                <button
                  onClick={() => copyToClipboard(setupCmd)}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--brand-blue)] hover:underline cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Đã copy' : 'Copy'}
                </button>
              </div>
              <div className="card-code">
                <code className="text-[13px] break-all leading-6">{setupCmd}</code>
              </div>
              <div className="mt-3 space-y-1">
                <p className="caption">Hướng dẫn:</p>
                <p className="caption">1. Copy lệnh ở trên</p>
                <p className="caption">2. Mở <b>{os === 'windows' ? 'PowerShell' : 'Terminal'}</b>, dán lệnh và nhấn Enter</p>
                <p className="caption">3. Sau đó chạy: <code className="font-mono text-[12px] bg-[var(--cream-50)] px-1 rounded">codex</code></p>
              </div>
            </div>
          </>
        )}

        {/* Hermes Agent */}
        {tool === 'hermes-agent' && (
          <>
            <div className="mb-4">
              <label className="form-label">Hệ điều hành</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOs('windows')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'windows'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Monitor className="h-4 w-4" /> Windows
                </button>
                <button
                  onClick={() => setOs('mac')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px] transition-all ${
                    os === 'mac'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-medium'
                      : 'border-[var(--lavender-100)] text-[var(--stone-600)] hover:border-[var(--stone-600)]'
                  }`}
                >
                  <Apple className="h-4 w-4" /> macOS / Linux
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Model</label>
              <select value={hermesModel} onChange={e => setHermesModel(e.target.value)} className="input">
                <option value="">Chọn model...</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="label flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> Lệnh cài đặt</span>
                <button
                  onClick={() => copyToClipboard(setupCmd)}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--brand-blue)] hover:underline cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Đã copy' : 'Copy'}
                </button>
              </div>
              <div className="card-code">
                <code className="text-[13px] break-all leading-6">{setupCmd}</code>
              </div>
              <div className="mt-3 space-y-1">
                <p className="caption">Hướng dẫn:</p>
                <p className="caption">1. Copy lệnh ở trên</p>
                <p className="caption">2. Mở <b>{os === 'windows' ? 'PowerShell' : 'Terminal'}</b>, dán lệnh và nhấn Enter</p>
                <p className="caption">3. Sau đó chạy: <code className="font-mono text-[12px] bg-[var(--cream-50)] px-1 rounded">hermes</code></p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual API docs */}
      <div className="card">
        <h2 className="heading-5 mb-4">API Reference</h2>
        <div className="space-y-4">
          <div>
            <span className="label">Endpoints</span>
            <div className="card-code mt-2">
              <pre className="whitespace-pre-wrap text-[13px] leading-5">{`Base URL:  ${base}
OpenAI:    POST ${base}/v1/chat/completions
           GET  ${base}/v1/models
Anthropic: POST ${base}/v1/messages

Streaming: stream: true — SSE đúng format từng provider.`}</pre>
            </div>
          </div>

          <div>
            <span className="label">cURL — OpenAI</span>
            <div className="card-code mt-2">
              <pre className="whitespace-pre-wrap text-[13px] leading-5">{`curl ${base}/v1/chat/completions \\
  -H "Authorization: Bearer ${selectedKey || 'sk-cw-xxxx'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${cursorModel || 'claude-sonnet-4-5'}",
    "messages": [{"role":"user","content":"Xin chào"}],
    "stream": true
  }'`}</pre>
            </div>
          </div>

          <div>
            <span className="label">cURL — Anthropic</span>
            <div className="card-code mt-2">
              <pre className="whitespace-pre-wrap text-[13px] leading-5">{`curl ${base}/v1/messages \\
  -H "x-api-key: ${selectedKey || 'sk-cw-xxxx'}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${sonnet || 'claude-sonnet-4-5'}",
    "max_tokens": 1024,
    "messages": [{"role":"user","content":"Hi"}]
  }'`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
