'use client';

import { useCallback, useState } from 'react';
import { Apple, Check, Copy, Monitor, Terminal } from 'lucide-react';

type Tool = 'claude-code' | 'codex-cli';
type Os = 'windows' | 'mac';

const BASE_URL = 'https://lccaptcha.io.vn';

const TOOLS: { id: Tool; label: string; summary: string }[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    summary: 'Configure ANTHROPIC_BASE_URL and settings.json for Claude Code.',
  },
  {
    id: 'codex-cli',
    label: 'Codex CLI',
    summary: 'Configure Api4Cheap as the Codex provider with Responses API.',
  },
];

export default function DocsPage() {
  const [tool, setTool] = useState<Tool>('claude-code');
  const [os, setOs] = useState<Os>('windows');
  const [apiKey, setApiKey] = useState('');
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [copiedUninstall, setCopiedUninstall] = useState(false);

  const getSetupCommand = useCallback(() => {
    const params = new URLSearchParams({ key: apiKey || 'YOUR_API_KEY', os });
    const url = `${BASE_URL}/api/setup/${tool}?${params.toString()}`;
    return os === 'windows' ? `irm "${url}" | iex` : `curl -fsSL "${url}" | bash`;
  }, [apiKey, os, tool]);

  const getUninstallCommand = useCallback(() => {
    const url = `${BASE_URL}/api/setup/${tool}/uninstall?os=${os}`;
    return os === 'windows' ? `irm "${url}" | iex` : `curl -fsSL "${url}" | bash`;
  }, [os, tool]);

  const copy = async (text: string, setter: (value: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const setupCmd = getSetupCommand();
  const uninstallCmd = getUninstallCommand();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="heading-1">Quick Setup</h1>
        <p className="body-sm text-[var(--stone-600)] mt-1">
          Configure Api4Cheap for Claude Code or Codex CLI using the live base URL.
        </p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 rounded-lg bg-[var(--cream-50)] mb-6">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTool(item.id)}
              className={`flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-md px-4 py-3 text-left transition-all ${
                tool === item.id
                  ? 'bg-white dark:bg-[#2a2a29] shadow-sm text-[var(--charcoal-900)]'
                  : 'text-[var(--stone-600)] hover:text-[var(--charcoal-900)]'
              }`}
            >
              <span className="text-[14px] font-medium">{item.label}</span>
              <span className="text-[12px] leading-4 text-[var(--stone-600)]">{item.summary}</span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="form-label">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="YOUR_API_KEY"
            className="input"
          />
          <p className="caption mt-1">Paste the full Api4Cheap API key. The setup script writes it only to local config files.</p>
        </div>

        <div className="mb-4">
          <label className="form-label">Operating system</label>
          <div className="flex flex-wrap gap-2">
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

        {tool === 'claude-code' ? <ClaudeSummary /> : <CodexSummary />}

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="label flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" /> Setup command
            </span>
            <button
              onClick={() => copy(setupCmd, setCopiedSetup)}
              className="btn-secondary py-2 px-3 text-[13px]"
            >
              {copiedSetup ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedSetup ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 space-y-1">
            <p className="caption">1. Click Copy to copy the generated setup command for your selected OS.</p>
            <p className="caption">2. Run it in {os === 'windows' ? 'PowerShell' : 'Terminal'}.</p>
            <p className="caption">
              3. Restart the shell, then run{' '}
              <code className="font-mono text-[12px] bg-[var(--cream-50)] px-1 rounded">
                {tool === 'claude-code' ? 'claude' : 'codex'}
              </code>
              .
            </p>
          </div>
        </div>

        <details className="mt-5">
          <summary className="text-[13px] text-red-500 cursor-pointer hover:underline">Uninstall Api4Cheap config</summary>
          <div className="mt-2 flex items-center gap-2">
            <p className="caption flex-1">Copy the uninstall command for the selected client and OS.</p>
            <button
              onClick={() => copy(uninstallCmd, setCopiedUninstall)}
              className="btn-secondary py-2 px-3 text-[13px]"
              aria-label="Copy uninstall command"
            >
              {copiedUninstall ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedUninstall ? 'Copied' : 'Copy'}
            </button>
          </div>
        </details>
      </div>

      <div className="card">
        <h2 className="heading-5 mb-4">Live endpoints</h2>
        <div className="card-code">
          <pre className="whitespace-pre-wrap text-[13px] leading-5">{`Claude Code base URL: ${BASE_URL}
Claude Messages API:  POST ${BASE_URL}/v1/messages

Codex base URL:       ${BASE_URL}
Codex Responses API:  POST ${BASE_URL}/v1/responses
Models:               GET  ${BASE_URL}/v1/models`}</pre>
        </div>
      </div>
    </div>
  );
}

function ClaudeSummary() {
  return (
    <div className="card-code">
      <pre className="whitespace-pre-wrap text-[13px] leading-5">{`~/.claude/settings.json

{
  "env": {
    "ANTHROPIC_API_KEY": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "https://lccaptcha.io.vn",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": { "allow": [], "deny": [] }
}`}</pre>
    </div>
  );
}

function CodexSummary() {
  return (
    <div className="card-code">
      <pre className="whitespace-pre-wrap text-[13px] leading-5">{`~/.codex/config.toml

model_provider = "api4cheap"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "https://lccaptcha.io.vn"
wire_api = "responses"`}</pre>
    </div>
  );
}
