'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Apple,
  Bot,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Cpu,
  KeyRound,
  Monitor,
  Settings,
  Sparkles,
  Terminal,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

type Tool = 'claude-code' | 'codex-cli' | 'openclaw' | 'hermes';
type ActiveTool = 'claude-code' | 'codex-cli';
type Os = 'windows' | 'mac';
type AllowedModel = { id: string; name: string; provider: string };
type ModelOption = { label: string; value: string };

const BASE_URL = 'https://lccaptcha.io.vn';
const SETUP_BASE = `${BASE_URL}/api/v1/setup`;

const TOOL_OPTIONS: {
  id: Tool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}[] = [
  { id: 'claude-code', label: 'Claude Code', icon: Sparkles },
  { id: 'openclaw', label: 'OpenClaw', icon: Bot, disabled: true },
  { id: 'codex-cli', label: 'Codex CLI', icon: Code2 },
  { id: 'hermes', label: 'Hermes', icon: Cpu, disabled: true },
];

const CLAUDE_MODEL_OPTIONS = {
  haiku: [
    { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5-20251001' },
    { label: 'Claude Haiku 4', value: 'claude-haiku-4' },
  ],
  sonnet: [
    { label: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6' },
    { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5' },
  ],
  opus: [
    { label: 'Claude Opus 4.6', value: 'claude-opus-4-6' },
    { label: 'Claude Opus 4.5', value: 'claude-opus-4-5' },
  ],
};

const CODEX_MODEL_OPTIONS = [
  { label: 'GPT-5 Nano', value: 'gpt-5-nano' },
  { label: 'GPT-5 Mini', value: 'gpt-5-mini' },
  { label: 'GPT-5', value: 'gpt-5' },
  { label: 'GPT-5.5', value: 'gpt-5.5' },
];

function labelFromModelName(name: string) {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

function modelToOption(model: AllowedModel): ModelOption {
  return { label: labelFromModelName(model.name), value: model.name };
}

function firstValue(options: ModelOption[], fallback: string) {
  return options[0]?.value || fallback;
}

function pickByKeyword(options: ModelOption[], keyword: string, fallback: string) {
  return options.find((option) => option.value.toLowerCase().includes(keyword))?.value || firstValue(options, fallback);
}

function ensureAllowed(value: string, options: ModelOption[], fallback: string) {
  return options.some((option) => option.value === value) ? value : firstValue(options, fallback);
}

function fallbackOptions(loading: boolean, allowed: AllowedModel[], options: ModelOption[]) {
  return loading && allowed.length === 0 ? options : [];
}

function copyLabel(copied: boolean) {
  return copied ? 'Copied' : 'Copy';
}

function codeBlockTone(kind: 'setup' | 'uninstall') {
  return kind === 'setup'
    ? 'text-[#7ee6a1] selection:bg-emerald-300/20'
    : 'text-[#ff9ca8] selection:bg-rose-300/20';
}

function maskedKey(key: string) {
  if (!key) return 'sk-bee-...';
  if (key.length <= 18) return key;
  return `${key.slice(0, 10)}...${key.slice(-6)}`;
}

export default function DocsPage() {
  const [tool, setTool] = useState<ActiveTool>('claude-code');
  const [os, setOs] = useState<Os>('windows');
  const [apiKey, setApiKey] = useState('');
  const [haiku, setHaiku] = useState(CLAUDE_MODEL_OPTIONS.haiku[0].value);
  const [sonnet, setSonnet] = useState(CLAUDE_MODEL_OPTIONS.sonnet[0].value);
  const [opus, setOpus] = useState(CLAUDE_MODEL_OPTIONS.opus[0].value);
  const [small, setSmall] = useState(CODEX_MODEL_OPTIONS[0].value);
  const [medium, setMedium] = useState(CODEX_MODEL_OPTIONS[0].value);
  const [large, setLarge] = useState(CODEX_MODEL_OPTIONS[0].value);
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [copiedUninstall, setCopiedUninstall] = useState(false);
  const [allowedModels, setAllowedModels] = useState<AllowedModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      try {
        const response = await fetch('/api/models', { credentials: 'include' });
        if (!response.ok) throw new Error('failed');
        const data = await response.json();
        if (!cancelled) setAllowedModels(Array.isArray(data.models) ? data.models : []);
      } catch {
        if (!cancelled) setAllowedModels([]);
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    }
    loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const claudeAllowedOptions = useMemo(() => {
    const options = allowedModels
      .filter((model) => model.provider === 'anthropic' || model.name.toLowerCase().includes('claude'))
      .map(modelToOption);
    return options.length > 0 ? options : fallbackOptions(modelsLoading, allowedModels, [
      ...CLAUDE_MODEL_OPTIONS.haiku,
      ...CLAUDE_MODEL_OPTIONS.sonnet,
      ...CLAUDE_MODEL_OPTIONS.opus,
    ]);
  }, [allowedModels, modelsLoading]);

  const codexAllowedOptions = useMemo(() => {
    const options = allowedModels
      .filter((model) => model.provider !== 'anthropic' && !model.name.toLowerCase().includes('claude'))
      .map(modelToOption);
    return options.length > 0 ? options : fallbackOptions(modelsLoading, allowedModels, CODEX_MODEL_OPTIONS);
  }, [allowedModels, modelsLoading]);

  useEffect(() => {
    setHaiku((value) => ensureAllowed(value, claudeAllowedOptions, pickByKeyword(claudeAllowedOptions, 'haiku', CLAUDE_MODEL_OPTIONS.haiku[0].value)));
    setSonnet((value) => ensureAllowed(value, claudeAllowedOptions, pickByKeyword(claudeAllowedOptions, 'sonnet', CLAUDE_MODEL_OPTIONS.sonnet[0].value)));
    setOpus((value) => ensureAllowed(value, claudeAllowedOptions, pickByKeyword(claudeAllowedOptions, 'opus', CLAUDE_MODEL_OPTIONS.opus[0].value)));
  }, [claudeAllowedOptions]);

  useEffect(() => {
    setSmall((value) => ensureAllowed(value, codexAllowedOptions, CODEX_MODEL_OPTIONS[0].value));
    setMedium((value) => ensureAllowed(value, codexAllowedOptions, CODEX_MODEL_OPTIONS[0].value));
    setLarge((value) => ensureAllowed(value, codexAllowedOptions, CODEX_MODEL_OPTIONS[0].value));
  }, [codexAllowedOptions]);

  const canCreateSetup = tool === 'claude-code' ? claudeAllowedOptions.length > 0 : codexAllowedOptions.length > 0;

  const params = useMemo(() => {
    const query = new URLSearchParams({ key: apiKey || 'YOUR_API_KEY', os });
    if (tool === 'claude-code') {
      query.set('haiku', haiku);
      query.set('sonnet', sonnet);
      query.set('opus', opus);
    } else {
      query.set('small', small);
      query.set('medium', medium);
      query.set('large', large);
    }
    return query;
  }, [apiKey, haiku, large, medium, opus, os, small, sonnet, tool]);

  const setupUrl = `${SETUP_BASE}/${tool}?${params.toString()}`;
  const uninstallUrl = `${SETUP_BASE}/${tool}/uninstall?os=${os}`;
  const setupCmd = canCreateSetup
    ? os === 'windows' ? `irm "${setupUrl}" | iex` : `curl -fsSL "${setupUrl}" | bash`
    : 'Goi hien tai chua co model phu hop de tao lenh cai dat.';
  const uninstallCmd = os === 'windows' ? `irm "${uninstallUrl}" | iex` : `curl -fsSL "${uninstallUrl}" | bash`;

  const copy = useCallback(async (text: string, setter: (value: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1600);
  }, []);

  const chooseTool = (id: Tool) => {
    if (id === 'claude-code' || id === 'codex-cli') setTool(id);
  };

  const currentCopy = tool === 'claude-code'
    ? 'Cau hinh Claude Code dung Api4Cheap API. Tu dong thiet lap endpoint, API key va bypass onboarding.'
    : 'Cau hinh Codex CLI dung Api4Cheap API. Tu dong thiet lap provider, API key va model mapping.';

  return (
    <div className="min-h-[calc(100vh-5rem)] animate-fade-in">
      <div className="mx-auto w-full max-w-[460px] rounded-[24px] border border-white/70 bg-[#f7f7f6] p-5 shadow-[0_24px_80px_rgba(20,20,19,0.18)] dark:border-[#30302E] dark:bg-[#1A1A19] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold leading-7 text-[#1d1d1b] dark:text-[#FAF9F5]">Cau hinh API Key</h1>
            <p className="mt-0.5 text-[13px] leading-5 text-[var(--stone-600)]">
              Thiet lap nhanh cho cong cu AI hoac cau hinh model fallback.
            </p>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--stone-600)] transition-colors hover:bg-black/5 hover:text-[var(--charcoal-900)] dark:hover:bg-white/10"
            aria-label="Close docs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-[18px] bg-white p-1 shadow-sm dark:bg-[#222221]">
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-2 rounded-[14px] bg-white text-[13px] font-medium text-[#171716] shadow-[0_4px_18px_rgba(20,20,19,0.08)] dark:bg-[#30302E] dark:text-[#FAF9F5]"
          >
            <Zap className="h-4 w-4" />
            Quick Setup
          </button>
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-2 rounded-[14px] text-[13px] font-medium text-[var(--stone-600)]"
          >
            <Settings className="h-4 w-4" />
            Model Fallback
          </button>
        </div>

        <div className="mb-4 grid grid-cols-4 rounded-[18px] border border-[#e7e7e3] bg-white p-1 shadow-sm dark:border-[#30302E] dark:bg-[#222221]">
          {TOOL_OPTIONS.map((item) => {
            const active = item.id === tool;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseTool(item.id)}
                disabled={item.disabled}
                className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[12px] font-medium transition-all ${
                  active
                    ? 'bg-[#f2f2ef] text-[#222220] shadow-sm dark:bg-[#30302E] dark:text-[#FAF9F5]'
                    : 'text-[var(--stone-600)] hover:bg-[#f8f8f6] disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-[#2a2a29]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${item.id === 'openclaw' ? 'text-[#d45b7a]' : ''}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mb-4 text-[12px] leading-5 text-[var(--stone-600)]">{currentCopy}</p>

        <div className="mb-4 rounded-[18px] border border-[#f4df9c] bg-[#fff9df] px-3 py-2 text-[12px] leading-5 text-[#9b6b16] shadow-sm dark:border-[#574515] dark:bg-[#2b2615] dark:text-[#e7c76d]">
          <span className="font-medium">Warning:</span> API key da bi an sau 24h. Vui long dan full API key de tao lenh cai dat.
        </div>

        <div className="mb-5">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stone-600)]" />
            <input
              type="text"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value.trim())}
              placeholder="Dan API key day du (sk-bee-...)"
              className="h-10 w-full rounded-[18px] border border-[#e6e6e2] bg-white pl-9 pr-3 font-mono text-[12px] text-[#222220] outline-none transition focus:border-[#2C84DB] focus:shadow-[0_0_0_3px_rgba(44,132,219,0.12)] dark:border-[#30302E] dark:bg-[#222221] dark:text-[#FAF9F5]"
            />
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-[12px] font-medium text-[var(--stone-600)]">He dieu hanh</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOs('mac')}
              className={`flex h-10 items-center justify-center gap-2 rounded-[18px] border px-3 text-[13px] font-medium transition-all ${
                os === 'mac'
                  ? 'border-[#2C84DB] bg-[#eef7ff] text-[#286fae] dark:bg-[#102335]'
                  : 'border-[#e5e5e0] bg-white text-[var(--stone-600)] hover:border-[#b8b8b1] dark:border-[#30302E] dark:bg-[#222221]'
              }`}
            >
              <Apple className="h-4 w-4" />
              macOS / Linux
            </button>
            <button
              type="button"
              onClick={() => setOs('windows')}
              className={`flex h-10 items-center justify-center gap-2 rounded-[18px] border px-3 text-[13px] font-medium transition-all ${
                os === 'windows'
                  ? 'border-[#2C84DB] bg-[#eef7ff] text-[#286fae] dark:bg-[#102335]'
                  : 'border-[#e5e5e0] bg-white text-[var(--stone-600)] hover:border-[#b8b8b1] dark:border-[#30302E] dark:bg-[#222221]'
              }`}
            >
              <Monitor className="h-4 w-4" />
              Windows
            </button>
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-[12px] font-medium text-[var(--stone-600)]">
            Model Mapping {tool === 'claude-code' ? '(Claude Code alias -> model thuc te)' : '(Codex size -> model thuc te)'}
          </p>
          <p className="mb-2 text-[11px] leading-4 text-[var(--stone-600)]">
            {modelsLoading
              ? 'Dang tai model trong goi...'
              : canCreateSetup
                ? 'Chi hien thi model ma goi hien tai cho phep su dung.'
                : 'Goi hien tai chua cho phep model phu hop voi cong cu nay.'}
          </p>
          {tool === 'claude-code' ? (
            <div className="grid grid-cols-3 gap-2">
              <ModelSelect label="Haiku (Fast)" value={haiku} onChange={setHaiku} options={claudeAllowedOptions} />
              <ModelSelect label="Sonnet (Default)" value={sonnet} onChange={setSonnet} options={claudeAllowedOptions} />
              <ModelSelect label="Opus (Powerful)" value={opus} onChange={setOpus} options={claudeAllowedOptions} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <ModelSelect label="Small" value={small} onChange={setSmall} options={codexAllowedOptions} />
              <ModelSelect label="Medium" value={medium} onChange={setMedium} options={codexAllowedOptions} />
              <ModelSelect label="Large" value={large} onChange={setLarge} options={codexAllowedOptions} />
            </div>
          )}
        </div>

        <CommandSection
          title="Lenh cai dat"
          command={setupCmd}
          copied={copiedSetup}
          onCopy={() => copy(setupCmd, setCopiedSetup)}
          tone="setup"
          disabled={!canCreateSetup}
        />

        <div className="mt-4 rounded-[18px] border border-[#e8e8e4] bg-white px-4 py-3 shadow-sm dark:border-[#30302E] dark:bg-[#222221]">
          <p className="mb-1 text-[13px] font-medium text-[#222220] dark:text-[#FAF9F5]">Huong dan:</p>
          <ol className="list-decimal space-y-0.5 pl-4 text-[12px] leading-5 text-[var(--stone-600)]">
            <li>Copy lenh o tren</li>
            <li>Mo {os === 'windows' ? 'PowerShell' : 'Terminal'} dan lenh va nhan Enter</li>
            <li>Sau do chay: <span className="font-mono text-[#222220] dark:text-[#FAF9F5]">{tool === 'claude-code' ? 'claude' : 'codex'}</span></li>
          </ol>
        </div>

        <details className="group mt-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[12px] font-medium text-[#d95b68]">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            Go cai dat
          </summary>
          <div className="mt-3">
            <CommandSection
              title="Lenh go cai dat"
              command={uninstallCmd}
              copied={copiedUninstall}
              onCopy={() => copy(uninstallCmd, setCopiedUninstall)}
              tone="uninstall"
              compact
            />
          </div>
        </details>

        <div className="mt-5 text-[11px] leading-5 text-[var(--stone-600)]">
          Command se dung key <span className="font-mono">{maskedKey(apiKey)}</span> va endpoint <span className="font-mono">{BASE_URL}</span>.
        </div>
      </div>
    </div>
  );
}

function ModelSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block truncate text-[10px] font-medium leading-4 text-[var(--stone-600)]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={options.length === 0}
          className="h-9 w-full appearance-none rounded-[15px] border border-[#e8e8e4] bg-white px-3 pr-7 text-[11px] font-medium text-[#222220] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#2C84DB] focus:shadow-[0_0_0_3px_rgba(44,132,219,0.12)] dark:border-[#30302E] dark:bg-[#222221] dark:text-[#FAF9F5]"
        >
          {options.length > 0
            ? options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))
            : <option value={value}>Khong co model</option>}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--stone-600)]" />
      </span>
    </label>
  );
}

function CommandSection({
  title,
  command,
  copied,
  onCopy,
  tone,
  compact = false,
  disabled = false,
}: {
  title: string;
  command: string;
  copied: boolean;
  onCopy: () => void;
  tone: 'setup' | 'uninstall';
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--stone-600)]">
          {tone === 'setup' ? <Terminal className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
          {title}
        </span>
        <button
          type="button"
          onClick={onCopy}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] font-medium text-[var(--stone-600)] transition hover:bg-black/5 hover:text-[var(--charcoal-900)] disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/10"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copyLabel(copied)}
        </button>
      </div>
      <div className={`rounded-[18px] bg-[#111724] px-4 py-3 shadow-[0_10px_24px_rgba(9,12,19,0.18)] ${compact ? 'min-h-[58px]' : 'min-h-[88px]'}`}>
        <code className={`block whitespace-pre-wrap break-all font-mono text-[12px] leading-6 ${codeBlockTone(tone)}`}>{command}</code>
      </div>
    </section>
  );
}
