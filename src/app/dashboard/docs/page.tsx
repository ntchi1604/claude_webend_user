export default function DocsPage() {
  const base = 'https://lccaptcha.io.vn';
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="heading-1">Tài liệu API</h1>
        <p className="body-sm text-[var(--stone-600)] mt-1">Hỗ trợ <b>OpenAI</b> & <b>Anthropic</b> compatible. API key dạng <code className="font-mono text-[13px] bg-[var(--cream-50)] px-1.5 py-0.5 rounded">sk-cw-...</code></p>
      </div>

      <Section title="Endpoints">
        <Code>{`Base URL:  ${base}
OpenAI:    POST ${base}/v1/chat/completions
           GET  ${base}/v1/models
Anthropic: POST ${base}/v1/messages

Streaming: stream: true — SSE đúng format từng provider.`}</Code>
      </Section>

      <Section title="cURL — OpenAI">
        <Code>{`curl ${base}/v1/chat/completions \\
  -H "Authorization: Bearer sk-cw-xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"Xin chào"}],
    "stream": true
  }'`}</Code>
      </Section>

      <Section title="cURL — Anthropic">
        <Code>{`curl ${base}/v1/messages \\
  -H "x-api-key: sk-cw-xxxx" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 1024,
    "messages": [{"role":"user","content":"Hi"}]
  }'`}</Code>
      </Section>

      <Section title="Cursor / Cline / Continue / Roo Code">
        <p className="body-sm mb-2">Provider: <b>OpenAI Compatible</b></p>
        <Code>{`Base URL: ${base}/v1
API Key:  sk-cw-xxxx
Model ID: claude-sonnet-4-5`}</Code>
      </Section>

      <Section title="Claude Code">
        <Code>{`# Windows PowerShell
$env:ANTHROPIC_BASE_URL="${base}"
$env:ANTHROPIC_AUTH_TOKEN="sk-cw-xxxx"
claude

# macOS/Linux
export ANTHROPIC_BASE_URL="${base}"
export ANTHROPIC_AUTH_TOKEN="sk-cw-xxxx"
claude`}</Code>
      </Section>

      <Section title="Rate limits & Quota">
        <p className="body-sm">Mặc định: <b>60 RPM</b>, <b>200K TPM</b> per API key. Vượt → HTTP 429.</p>
        <p className="body-sm mt-2">Quota gói: rolling window (default 5h). Khi gần đầy → ưu tiên model rẻ.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="heading-5 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="card-code whitespace-pre-wrap text-[13px] leading-5 overflow-x-auto">{children}</pre>
  );
}
