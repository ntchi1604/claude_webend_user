'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Apple,
  Blocks,
  Check,
  ChevronDown,
  Code2,
  Copy,
  KeyRound,
  Monitor,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';

type ActiveTool = 'claude-code' | 'codex-cli' | 'vscode-ext';
type Os = 'windows' | 'mac';
type AllowedModel = { id: string; name: string; provider: string };
type ModelOption = { label: string; value: string };

const BASE_URL = 'https://lccaptcha.io.vn';
const SETUP_BASE = `${BASE_URL}/api/v1/setup`;

const TOOL_OPTIONS: {
  id: ActiveTool;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: 'Thiết lập endpoint, API key và model Claude được gói cho phép.',
    icon: Zap,
  },
  {
    id: 'codex-cli',
    label: 'Codex CLI',
    description: 'Thiết lập provider Api4Cheap cho Codex CLI và Responses API.',
    icon: Code2,
  },
  {
    id: 'vscode-ext',
    label: 'VS Code Extension',
    description: 'Cấu hình Claude Code extension cho VS Code qua settings.json.',
    icon: Blocks,
  },
];

const CLAUDE_FALLBACK_OPTIONS = {
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

const CODEX_FALLBACK_OPTIONS = [
  { label: 'GPT-5 Nano', value: 'gpt-5-nano' },
  { label: 'GPT-5 Mini', value: 'gpt-5-mini' },
  { label: 'GPT-5', value: 'gpt-5' },
  { label: 'GPT-5.5', value: 'gpt-5.5' },
];

function labelFromModelName(name: string) {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === 'gpt') return 'GPT';
      if (/^\d/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
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

function maskedKey(key: string) {
  if (!key) return 'sk-a4c-...';
  if (key.length <= 18) return key;
  return `${key.slice(0, 10)}...${key.slice(-6)}`;
}

function copiedLabel(copied: boolean) {
  return copied ? 'Đã sao chép' : 'Sao chép';
}

export default function DocsPage() {
  const [tool, setTool] = useState<ActiveTool>('claude-code');
  const [os, setOs] = useState<Os>('windows');
  const [apiKey, setApiKey] = useState('');
  const [haiku, setHaiku] = useState(CLAUDE_FALLBACK_OPTIONS.haiku[0].value);
  const [sonnet, setSonnet] = useState(CLAUDE_FALLBACK_OPTIONS.sonnet[0].value);
  const [opus, setOpus] = useState(CLAUDE_FALLBACK_OPTIONS.opus[0].value);
  const [small, setSmall] = useState(CODEX_FALLBACK_OPTIONS[0].value);
  const [medium, setMedium] = useState(CODEX_FALLBACK_OPTIONS[0].value);
  const [large, setLarge] = useState(CODEX_FALLBACK_OPTIONS[0].value);
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [copiedUninstall, setCopiedUninstall] = useState(false);
  const [copiedVscodeSnippet, setCopiedVscodeSnippet] = useState(false);
  const [vscodeMainModel, setVscodeMainModel] = useState('');
  const [vscodeEffortLevel, setVscodeEffortLevel] = useState<'low' | 'medium' | 'high' | 'max'>('medium');
  const [allowedModels, setAllowedModels] = useState<AllowedModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      try {
        const response = await fetch('/api/models', { credentials: 'include' });
        if (!response.ok) throw new Error('Không tải được model');
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
      ...CLAUDE_FALLBACK_OPTIONS.haiku,
      ...CLAUDE_FALLBACK_OPTIONS.sonnet,
      ...CLAUDE_FALLBACK_OPTIONS.opus,
    ]);
  }, [allowedModels, modelsLoading]);

  const codexAllowedOptions = useMemo(() => {
    const options = allowedModels
      .filter((model) => model.provider !== 'anthropic' && !model.name.toLowerCase().includes('claude'))
      .map(modelToOption);
    return options.length > 0 ? options : fallbackOptions(modelsLoading, allowedModels, CODEX_FALLBACK_OPTIONS);
  }, [allowedModels, modelsLoading]);

  useEffect(() => {
    setHaiku((value) => ensureAllowed(value, claudeAllowedOptions, pickByKeyword(claudeAllowedOptions, 'haiku', CLAUDE_FALLBACK_OPTIONS.haiku[0].value)));
    setSonnet((value) => ensureAllowed(value, claudeAllowedOptions, pickByKeyword(claudeAllowedOptions, 'sonnet', CLAUDE_FALLBACK_OPTIONS.sonnet[0].value)));
    setOpus((value) => ensureAllowed(value, claudeAllowedOptions, pickByKeyword(claudeAllowedOptions, 'opus', CLAUDE_FALLBACK_OPTIONS.opus[0].value)));
  }, [claudeAllowedOptions]);

  useEffect(() => {
    setSmall((value) => ensureAllowed(value, codexAllowedOptions, CODEX_FALLBACK_OPTIONS[0].value));
    setMedium((value) => ensureAllowed(value, codexAllowedOptions, CODEX_FALLBACK_OPTIONS[0].value));
    setLarge((value) => ensureAllowed(value, codexAllowedOptions, CODEX_FALLBACK_OPTIONS[0].value));
  }, [codexAllowedOptions]);

  useEffect(() => {
    if (claudeAllowedOptions.length > 0 && !vscodeMainModel) {
      setVscodeMainModel(pickByKeyword(claudeAllowedOptions, 'sonnet', claudeAllowedOptions[0].value));
    }
  }, [claudeAllowedOptions, vscodeMainModel]);

  const canCreateSetup = tool === 'codex-cli' ? codexAllowedOptions.length > 0 : claudeAllowedOptions.length > 0;

  const vscodeSnippet = useMemo(() => {
    if (tool !== 'vscode-ext') return null;
    const env: Record<string, string> = {
      ANTHROPIC_AUTH_TOKEN: apiKey || 'YOUR_API_KEY',
      ANTHROPIC_BASE_URL: BASE_URL,
      ANTHROPIC_MODEL: vscodeMainModel || sonnet,
      ANTHROPIC_DEFAULT_OPUS_MODEL: opus,
      ANTHROPIC_DEFAULT_SONNET_MODEL: sonnet,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: haiku,
      CLAUDE_CODE_SUBAGENT_MODEL: haiku,
      CLAUDE_CODE_EFFORT_LEVEL: vscodeEffortLevel,
    };
    return { 'claudeCode.environmentVariables': env };
  }, [tool, apiKey, vscodeMainModel, opus, sonnet, haiku, vscodeEffortLevel]);

  const vscodeJsonText = vscodeSnippet ? JSON.stringify(vscodeSnippet, null, 2) : '';

  const params = useMemo(() => {
    const query = new URLSearchParams({ key: apiKey || 'YOUR_API_KEY', os });
    if (tool === 'claude-code') {
      query.set('haiku', haiku);
      query.set('sonnet', sonnet);
      query.set('opus', opus);
    } else if (tool === 'codex-cli') {
      query.set('small', small);
      query.set('medium', medium);
      query.set('large', large);
    } else if (tool === 'vscode-ext') {
      query.set('haiku', haiku);
      query.set('sonnet', sonnet);
      query.set('opus', opus);
      query.set('mainModel', vscodeMainModel || sonnet);
      query.set('effortLevel', vscodeEffortLevel);
    }
    return query;
  }, [apiKey, haiku, large, medium, opus, os, small, sonnet, tool, vscodeMainModel, vscodeEffortLevel]);

  const setupUrl = `${SETUP_BASE}/${tool}?${params.toString()}`;
  const uninstallUrl = `${SETUP_BASE}/${tool}/uninstall?os=${os}`;
  const setupCmd = canCreateSetup
    ? os === 'windows' ? `irm "${setupUrl}" | iex` : `curl -fsSL "${setupUrl}" | bash`
    : 'Gói hiện tại chưa có model phù hợp để tạo lệnh cài đặt.';
  const uninstallCmd = os === 'windows' ? `irm "${uninstallUrl}" | iex` : `curl -fsSL "${uninstallUrl}" | bash`;

  const copy = useCallback(async (text: string, setter: (value: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1600);
  }, []);

  const activeTool = TOOL_OPTIONS.find((item) => item.id === tool) ?? TOOL_OPTIONS[0];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="heading-1">Cài đặt nhanh khóa API</h1>
        <p className="body-sm mt-2 text-[var(--stone-600)]">
          Chọn công cụ, dán khóa API đầy đủ và chạy một lệnh duy nhất để cấu hình Api4Cheap trên máy của bạn.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {TOOL_OPTIONS.map((item) => {
            const active = item.id === tool;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTool(item.id)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  active
                    ? 'border-[var(--brand-blue)] bg-white shadow-[var(--shadow-standard)] dark:bg-[#222221]'
                    : 'border-[var(--lavender-100)] bg-white/70 hover:border-[var(--brand-blue)] hover:bg-white dark:bg-[#1A1A19]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-md ${active ? 'bg-[var(--brand-blue-light)] text-[var(--brand-blue)]' : 'bg-[var(--cream-50)] text-[var(--stone-600)]'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-[var(--charcoal-900)]">{item.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-5 text-[var(--stone-600)]">{item.description}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="rounded-lg border border-[var(--lavender-100)] bg-white p-5 shadow-[var(--shadow-standard)] dark:bg-[#1A1A19] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-[var(--lavender-100)] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--stone-600)]">Cài đặt nhanh</p>
              <h2 className="mt-1 text-[20px] font-semibold leading-7 text-[var(--charcoal-900)]">{activeTool.label}</h2>
            </div>
            <span className="rounded-md bg-[var(--cream-50)] px-3 py-1.5 text-[12px] font-medium text-[var(--stone-600)]">
              Địa chỉ API: {BASE_URL}
            </span>
          </div>

          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[var(--charcoal-900)]">Khóa API</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stone-600)]" />
                <input
                  type="text"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value.trim())}
                  placeholder="Dán khóa API đầy đủ, ví dụ sk-a4c-..."
                  className="h-11 w-full rounded-md border border-[var(--lavender-100)] bg-white pl-9 pr-3 font-mono text-[13px] outline-none transition focus:border-[var(--brand-blue)] focus:shadow-[0_0_0_3px_rgba(44,132,219,0.12)] dark:bg-[#222221]"
                />
              </div>
              <p className="mt-2 text-[12px] leading-5 text-[var(--stone-600)]">
                Khóa API chỉ dùng để tạo lệnh cấu hình. Nếu khóa đã bị ẩn, hãy dán lại khóa đầy đủ từ trang Khóa API.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--charcoal-900)]">Hệ điều hành</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <OsButton active={os === 'windows'} icon={Monitor} label="Windows" onClick={() => setOs('windows')} />
                <OsButton active={os === 'mac'} icon={Apple} label="macOS / Linux" onClick={() => setOs('mac')} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[var(--charcoal-900)]">Model trong gói</p>
                  <p className="text-[12px] leading-5 text-[var(--stone-600)]">
                    {modelsLoading
                      ? 'Đang tải danh sách model được phép sử dụng...'
                      : canCreateSetup
                        ? 'Chỉ hiển thị model mà gói hiện tại cho phép.'
                        : 'Gói hiện tại chưa có model phù hợp với công cụ này.'}
                  </p>
                </div>
              </div>

              {tool === 'codex-cli' ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <ModelSelect label="Nhỏ" value={small} onChange={setSmall} options={codexAllowedOptions} />
                  <ModelSelect label="Trung bình" value={medium} onChange={setMedium} options={codexAllowedOptions} />
                  <ModelSelect label="Lớn" value={large} onChange={setLarge} options={codexAllowedOptions} />
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3">
                  <ModelSelect label="Haiku" value={haiku} onChange={setHaiku} options={claudeAllowedOptions} />
                  <ModelSelect label="Sonnet" value={sonnet} onChange={setSonnet} options={claudeAllowedOptions} />
                  <ModelSelect label="Opus" value={opus} onChange={setOpus} options={claudeAllowedOptions} />
                </div>
              )}

              {tool === 'vscode-ext' && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <ModelSelect label="Model chính (ANTHROPIC_MODEL)" value={vscodeMainModel} onChange={setVscodeMainModel} options={claudeAllowedOptions} />
                  <label className="min-w-0">
                    <span className="mb-1 block text-[12px] font-medium text-[var(--stone-600)]">Effort Level</span>
                    <span className="relative block">
                      <select
                        value={vscodeEffortLevel}
                        onChange={(event) => setVscodeEffortLevel(event.target.value as typeof vscodeEffortLevel)}
                        className="h-10 w-full appearance-none rounded-md border border-[var(--lavender-100)] bg-white px-3 pr-8 text-[12px] font-medium text-[var(--charcoal-900)] outline-none transition focus:border-[var(--brand-blue)] focus:shadow-[0_0_0_3px_rgba(44,132,219,0.12)] dark:bg-[#222221]"
                      >
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                        <option value="max">Tối đa</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stone-600)]" />
                    </span>
                  </label>
                </div>
              )}
            </div>

            {tool === 'vscode-ext' ? (
              <>
                <CommandSection
                  title="Lệnh cài đặt"
                  command={setupCmd}
                  copied={copiedSetup}
                  onCopy={() => copy(setupCmd, setCopiedSetup)}
                  tone="setup"
                  disabled={!canCreateSetup}
                />

                <section>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--stone-600)]">
                      <Code2 className="h-4 w-4" />
                      JSON sẽ được thêm vào settings.json
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(vscodeJsonText, setCopiedVscodeSnippet)}
                      disabled={!canCreateSetup}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--stone-600)] transition hover:bg-black/5 hover:text-[var(--charcoal-900)] disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/10"
                    >
                      {copiedVscodeSnippet ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedLabel(copiedVscodeSnippet)}
                    </button>
                  </div>
                  <div className="rounded-lg bg-[#111724] px-4 py-3 shadow-[0_10px_24px_rgba(9,12,19,0.18)] min-h-[58px]">
                    <code className="block whitespace-pre-wrap break-all font-mono text-[12px] leading-6 text-[#7ee6a1]">{vscodeJsonText || 'Chọn model và dán API key để tạo cấu hình.'}</code>
                  </div>
                </section>

                <div className="rounded-lg border border-[var(--lavender-100)] bg-[var(--cream-50)] p-4">
                  <p className="mb-2 text-[13px] font-medium text-[var(--charcoal-900)]">Hướng dẫn</p>
                  <ol className="list-decimal space-y-1 pl-4 text-[12px] leading-5 text-[var(--stone-600)]">
                    <li>Sao chép lệnh cài đặt ở trên.</li>
                    <li>Mở {os === 'windows' ? 'PowerShell' : 'Terminal'}, dán lệnh và nhấn Enter.</li>
                    <li>Script sẽ tự động cập nhật <span className="font-mono">settings.json</span> của VS Code.</li>
                    <li>Khởi động lại VS Code để áp dụng cấu hình.</li>
                  </ol>
                </div>

                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-[#d95b68]">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    Gỡ cấu hình Api4Cheap
                  </summary>
                  <div className="mt-3">
                    <CommandSection
                      title="Lệnh gỡ cấu hình"
                      command={uninstallCmd}
                      copied={copiedUninstall}
                      onCopy={() => copy(uninstallCmd, setCopiedUninstall)}
                      tone="uninstall"
                      compact
                    />
                  </div>
                </details>
              </>
            ) : (
              <>
                <CommandSection
                  title="Lệnh cài đặt"
                  command={setupCmd}
                  copied={copiedSetup}
                  onCopy={() => copy(setupCmd, setCopiedSetup)}
                  tone="setup"
                  disabled={!canCreateSetup}
                />

                <div className="rounded-lg border border-[var(--lavender-100)] bg-[var(--cream-50)] p-4">
                  <p className="mb-2 text-[13px] font-medium text-[var(--charcoal-900)]">Hướng dẫn</p>
                  <ol className="list-decimal space-y-1 pl-4 text-[12px] leading-5 text-[var(--stone-600)]">
                    <li>Sao chép lệnh cài đặt ở trên.</li>
                    <li>Mở {os === 'windows' ? 'PowerShell' : 'Terminal'}, dán lệnh và nhấn Enter.</li>
                    <li>Sau khi cài xong, mở terminal mới rồi chạy <span className="font-mono text-[var(--charcoal-900)]">{tool === 'claude-code' ? 'claude' : 'codex'}</span>.</li>
                  </ol>
                </div>

                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-[#d95b68]">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    Gỡ cấu hình Api4Cheap
                  </summary>
                  <div className="mt-3">
                    <CommandSection
                      title="Lệnh gỡ cấu hình"
                      command={uninstallCmd}
                      copied={copiedUninstall}
                      onCopy={() => copy(uninstallCmd, setCopiedUninstall)}
                      tone="uninstall"
                      compact
                    />
                  </div>
                </details>
              </>
            )}

            <p className="text-[11px] leading-5 text-[var(--stone-600)]">
              Lệnh sẽ dùng khóa <span className="font-mono">{maskedKey(apiKey)}</span> và địa chỉ API <span className="font-mono">{BASE_URL}</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function OsButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-[14px] font-medium transition-all ${
        active
          ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)]'
          : 'border-[var(--lavender-100)] bg-white text-[var(--stone-600)] hover:border-[var(--brand-blue)] dark:bg-[#222221]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
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
  options: ModelOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[12px] font-medium text-[var(--stone-600)]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={options.length === 0}
          className="h-10 w-full appearance-none rounded-md border border-[var(--lavender-100)] bg-white px-3 pr-8 text-[12px] font-medium text-[var(--charcoal-900)] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-[var(--brand-blue)] focus:shadow-[0_0_0_3px_rgba(44,132,219,0.12)] dark:bg-[#222221]"
        >
          {options.length > 0
            ? options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))
            : <option value={value}>Không có model</option>}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--stone-600)]" />
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
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--stone-600)]">
          {tone === 'setup' ? <Terminal className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          {title}
        </span>
        <button
          type="button"
          onClick={onCopy}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--stone-600)] transition hover:bg-black/5 hover:text-[var(--charcoal-900)] disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/10"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copiedLabel(copied)}
        </button>
      </div>
      <div className={`rounded-lg bg-[#111724] px-4 py-3 shadow-[0_10px_24px_rgba(9,12,19,0.18)] ${compact ? 'min-h-[58px]' : 'min-h-[92px]'}`}>
        <code className={`block whitespace-pre-wrap break-all font-mono text-[12px] leading-6 ${tone === 'setup' ? 'text-[#7ee6a1]' : 'text-[#ff9ca8]'}`}>{command}</code>
      </div>
    </section>
  );
}
