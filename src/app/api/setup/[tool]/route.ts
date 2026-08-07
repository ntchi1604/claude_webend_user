import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/auth';
import { getSessionFromRequest } from '@/lib/session';

/**
 * GET /api/setup/:tool?key=...&os=windows|mac
 * GET /api/v1/setup/:tool?key=...&os=windows|mac
 * Trả về script PowerShell hoặc Bash cho Claude Code, Codex CLI hoặc VS Code Extension.
 *
 * Chấp nhận một trong hai: (1) session đăng nhập, hoặc (2) API key hợp lệ + active
 * trong query string — vì lệnh sinh ra chạy trên terminal không có cookie.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;
  const url = new URL(req.url);
  const rawKey = url.searchParams.get('key');
  const session = await getSessionFromRequest(req);

  // Two allowed paths:
  // 1. Logged-in session (cookie) — full access.
  // 2. A valid, active API key in the query string — needed because the
  //    generated command runs in a bare terminal (irm/curl) with no cookies.
  //    The key grants the same gateway access anyway, so this does not leak
  //    anything new; we still refuse inactive/unknown keys.
  if (rawKey) {
    const owned = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(rawKey) }, select: { active: true } });
    if (!owned || !owned.active) {
      return NextResponse.json({ error: 'API key không hợp lệ hoặc đã bị vô hiệu hoá' }, { status: 403 });
    }
  } else if (!session) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập' }, { status: 401 });
  }

  const key = clean(rawKey || '', 'YOUR_API_KEY');
  const os = url.searchParams.get('os') || 'windows';
  const baseUrl = getRequestOrigin(req, url);
  const claudeBaseUrl = baseUrl;
  const codexBaseUrl = `${baseUrl}/v1`;
  const keyShort = key.slice(0, 8) + '...';
  const claudeModels = {
    haiku: clean(url.searchParams.get('haiku'), 'claude-haiku-4-5'),
    sonnet: clean(url.searchParams.get('sonnet'), 'claude-sonnet-4-6'),
    opus: clean(url.searchParams.get('opus'), 'claude-opus-4-7'),
  };
  const codexModels = {
    small: clean(url.searchParams.get('small'), 'gpt-5-nano'),
    medium: clean(url.searchParams.get('medium'), 'gpt-5-nano'),
    large: clean(url.searchParams.get('large'), 'gpt-5-nano'),
  };

  let script = '';

  switch (tool) {
    case 'claude-code':
      script = os === 'windows'
        ? generateClaudeCodeWindows({ baseUrl: claudeBaseUrl, key, keyShort, ...claudeModels })
        : generateClaudeCodeUnix({ baseUrl: claudeBaseUrl, key, keyShort, ...claudeModels });
      break;
    case 'codex-cli':
      script = os === 'windows'
        ? generateCodexCliWindows({ baseUrl: codexBaseUrl, key, keyShort, ...codexModels })
        : generateCodexCliUnix({ baseUrl: codexBaseUrl, key, keyShort, ...codexModels });
      break;
    case 'vscode-ext': {
      const vscodeModels = {
        haiku: clean(url.searchParams.get('haiku'), 'claude-haiku-4-5'),
        sonnet: clean(url.searchParams.get('sonnet'), 'claude-sonnet-4-6'),
        opus: clean(url.searchParams.get('opus'), 'claude-opus-4-7'),
        mainModel: clean(url.searchParams.get('mainModel'), clean(url.searchParams.get('sonnet'), 'claude-sonnet-4-6')),
        effortLevel: clean(url.searchParams.get('effortLevel'), 'medium'),
      };
      script = os === 'windows'
        ? generateVsCodeExtWindows({ baseUrl: claudeBaseUrl, key, keyShort, ...vscodeModels })
        : generateVsCodeExtUnix({ baseUrl: claudeBaseUrl, key, keyShort, ...vscodeModels });
      break;
    }
    default:
      return NextResponse.json({ error: 'Công cụ không được hỗ trợ' }, { status: 404 });
  }

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    },
  });
}

function clean(value: string | null, fallback: string) {
  const cleaned = (value || fallback).replace(/[\r\n]/g, '').trim();
  return cleaned || fallback;
}

function cleanHeader(value: string | null) {
  return value?.split(',')[0]?.replace(/[\r\n]/g, '').trim() || '';
}

function cleanHost(value: string | null) {
  const host = cleanHeader(value).toLowerCase();
  return /^(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(:\d{1,5})?$/i.test(host) ? host : '';
}

function getRequestOrigin(req: NextRequest, url: URL) {
  const host = cleanHost(req.headers.get('x-forwarded-host')) || cleanHost(req.headers.get('host')) || cleanHost(url.host) || url.host;
  const hostname = host.startsWith('[')
    ? host.slice(1, host.indexOf(']')).toLowerCase()
    : host.split(':')[0].toLowerCase();
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const protocol = isLocal ? 'http' : 'https';
  return `${protocol}://${host}`;
}

function generateClaudeCodeWindows(p: {
  baseUrl: string;
  key: string;
  keyShort: string;
  haiku: string;
  sonnet: string;
  opus: string;
}) {
  return `Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Thiết lập Api4Cheap cho Claude Code" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: ${p.baseUrl}"
Write-Host "API Key:  ${p.keyShort}"
Write-Host "Haiku:    ${p.haiku}"
Write-Host "Sonnet:   ${p.sonnet}"
Write-Host "Opus:     ${p.opus}"
Write-Host ""

Write-Host "Đang kiểm tra điều kiện cài đặt..."
$nodeV = node --version 2>$null
if ($nodeV) { Write-Host "  OK Node.js $nodeV" -ForegroundColor Green } else { Write-Host "  CẢNH BÁO Cần Node.js 18+" -ForegroundColor Yellow }
$npmV = npm --version 2>$null
if ($npmV) { Write-Host "  OK npm $npmV" -ForegroundColor Green } else { Write-Host "  CẢNH BÁO Cần npm để cài Claude Code" -ForegroundColor Yellow }

$claudePath = Get-Command claude -ErrorAction SilentlyContinue
if ($claudePath) {
    Write-Host "  OK Claude Code đã được cài" -ForegroundColor Green
} elseif ($npmV) {
    Write-Host "Đang cài Claude Code..."
    npm install -g @anthropic-ai/claude-code
}
Write-Host ""

$credFile = Join-Path (Join-Path $env:USERPROFILE ".claude") ".credentials.json"
if (Test-Path $credFile) {
    Remove-Item $credFile -Force
    Write-Host "  OK Đã xoá .credentials.json (đăng nhập cũ)" -ForegroundColor Yellow
}
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
$env:ANTHROPIC_AUTH_TOKEN = $null
Write-Host "  OK Đã xoá ANTHROPIC_AUTH_TOKEN" -ForegroundColor Yellow
Write-Host ""

Write-Host "Đang cấu hình Claude Code..."
$claudeDir = Join-Path $env:USERPROFILE ".claude"
$settingsFile = Join-Path $claudeDir "settings.json"
if (-not (Test-Path $claudeDir)) { New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null }

if (Test-Path $settingsFile) {
    $bk = Join-Path $claudeDir "settings.json.api4cheap-backup"
    Copy-Item $settingsFile $bk -Force
    Write-Host "  Đã backup: $settingsFile" -ForegroundColor Yellow
}

$settingsContent = @'
{
    "model": "opus",
    "env": {
        "ANTHROPIC_API_KEY": "${p.key}",
        "ANTHROPIC_BASE_URL": "${p.baseUrl}",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${p.haiku}",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "${p.sonnet}",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "${p.opus}",
        "ANTHROPIC_DISABLE_INTERLEAVED_STREAMING": "1",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
        "allow": [],
        "deny": []
    },
    "effortLevel": "medium"
}
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($settingsFile, $settingsContent, $utf8NoBom)
Write-Host "  OK Đã cập nhật $settingsFile" -ForegroundColor Green
Write-Host ""

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Cấu hình hoàn tất!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Bước tiếp theo:" -ForegroundColor Cyan
Write-Host "  1. Khởi động lại PowerShell"
Write-Host "  2. Chạy: claude"
Write-Host ""
`;
}

function generateClaudeCodeUnix(p: {
  baseUrl: string;
  key: string;
  keyShort: string;
  haiku: string;
  sonnet: string;
  opus: string;
}) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Thiết lập Api4Cheap cho Claude Code"
echo "================================"
echo ""
echo "Endpoint: ${p.baseUrl}"
echo "API Key:  ${p.keyShort}"
echo "Haiku:    ${p.haiku}"
echo "Sonnet:   ${p.sonnet}"
echo "Opus:     ${p.opus}"
echo ""

echo "Đang kiểm tra điều kiện cài đặt..."
if command -v node >/dev/null 2>&1; then echo "  OK Node.js $(node --version)"; else echo "  CẢNH BÁO Cần Node.js 18+"; fi
if command -v npm >/dev/null 2>&1; then echo "  OK npm $(npm --version)"; else echo "  CẢNH BÁO Cần npm để cài Claude Code"; fi

if command -v claude >/dev/null 2>&1; then
  echo "  OK Claude Code đã được cài"
elif command -v npm >/dev/null 2>&1; then
  echo "Đang cài Claude Code..."
  npm install -g @anthropic-ai/claude-code
fi
echo ""

rm -f ~/.claude/.credentials.json 2>/dev/null
unset ANTHROPIC_AUTH_TOKEN

CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR"
SETTINGS="$CLAUDE_DIR/settings.json"

if [ -f "$SETTINGS" ]; then
  cp "$SETTINGS" "$CLAUDE_DIR/settings.json.api4cheap-backup"
fi

cat > "$SETTINGS" << 'SETTINGSEOF'
{
    "model": "opus",
    "env": {
        "ANTHROPIC_API_KEY": "${p.key}",
        "ANTHROPIC_BASE_URL": "${p.baseUrl}",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${p.haiku}",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "${p.sonnet}",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "${p.opus}",
        "ANTHROPIC_DISABLE_INTERLEAVED_STREAMING": "1",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
        "allow": [],
        "deny": []
    },
    "effortLevel": "medium"
}
SETTINGSEOF

echo "  OK Đã cập nhật settings.json"

echo ""
echo "================================"
echo "  Cấu hình hoàn tất!"
echo "================================"
echo ""
echo "Bước tiếp theo:"
echo "  1. Khởi động lại terminal"
echo "  2. Chạy: claude"
echo ""
`;
}

function generateCodexCliWindows(p: {
  baseUrl: string;
  key: string;
  keyShort: string;
  small: string;
  medium: string;
  large: string;
}) {
  return [
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host "  Thiết lập Api4Cheap cho Codex CLI" -ForegroundColor Cyan`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host ""`,
    `Write-Host "Endpoint:          ${p.baseUrl}"`,
    `Write-Host "API Key:           ${p.keyShort}"`,
    `Write-Host "Model nhỏ:         ${p.small}"`,
    `Write-Host "Model trung bình:  ${p.medium}"`,
    `Write-Host "Model lớn:         ${p.large}"`,
    `Write-Host ""`,
    ``,
    `Write-Host "Đang kiểm tra điều kiện cài đặt..."`,
    `$nodeV = node --version 2>$null`,
    `if ($nodeV) { Write-Host "  OK Node.js $nodeV" -ForegroundColor Green } else { Write-Host "  CẢNH BÁO Không tìm thấy Node.js" -ForegroundColor Yellow }`,
    `$npmV = npm --version 2>$null`,
    `if ($npmV) { Write-Host "  OK npm $npmV" -ForegroundColor Green } else { Write-Host "  CẢNH BÁO Không tìm thấy npm" -ForegroundColor Yellow }`,
    ``,
    `$codexPath = Get-Command codex -ErrorAction SilentlyContinue`,
    `if ($codexPath) { Write-Host "  OK Codex CLI đã được cài" -ForegroundColor Green } else {`,
    `    Write-Host "Đang cài Codex CLI..." -ForegroundColor Yellow`,
    `    npm install -g @openai/codex`,
    `    if ($?) { Write-Host "  OK Đã cài" -ForegroundColor Green } else { Write-Host "  LỖI Cài đặt thất bại" -ForegroundColor Red }`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "Đang cấu hình Codex CLI..."`,
    `$codexDir = Join-Path $env:USERPROFILE ".codex"`,
    `$configFile = Join-Path $codexDir "config.toml"`,
    `$authFile = Join-Path $codexDir "auth.json"`,
    `New-Item -ItemType Directory -Path $codexDir -Force | Out-Null`,
    `$configBackup = Join-Path $codexDir "config.toml.api4cheap-backup"`,
    `$authBackup = Join-Path $codexDir "auth.json.api4cheap-backup"`,
    `if (Test-Path $configFile) {`,
    `    Copy-Item -LiteralPath $configFile -Destination $configBackup -Force`,
    `    Write-Host "  Đã backup config.toml" -ForegroundColor Yellow`,
    `}`,
    `if (Test-Path $authFile) {`,
    `    Copy-Item -LiteralPath $authFile -Destination $authBackup -Force`,
    `    Write-Host "  Đã backup auth.json" -ForegroundColor Yellow`,
    `}`,
    ``,
    `$utf8NoBom = New-Object System.Text.UTF8Encoding $false`,
    `$authContent = @'`,
    JSON.stringify({ OPENAI_API_KEY: p.key }, null, 2),
    `'@`,
    `[System.IO.File]::WriteAllText($authFile, $authContent, $utf8NoBom)`,
    `Write-Host "  OK Đã ghi auth.json" -ForegroundColor Green`,
    ``,
    `$tomlContent = @'`,
    `model_provider = "api4cheap"`,
    `model = "${p.medium}"`,
    `model_reasoning_effort = "medium"`,
    `disable_response_storage = true`,
    `preferred_auth_method = "apikey"`,
    ``,
    `[model_providers.api4cheap]`,
    `name = "Api4Cheap"`,
    `base_url = "${p.baseUrl}"`,
    `wire_api = "responses"`,
    ``,
    `[profiles.small]`,
    `model_provider = "api4cheap"`,
    `model = "${p.small}"`,
    `model_reasoning_effort = "low"`,
    ``,
    `[profiles.medium]`,
    `model_provider = "api4cheap"`,
    `model = "${p.medium}"`,
    `model_reasoning_effort = "medium"`,
    ``,
    `[profiles.large]`,
    `model_provider = "api4cheap"`,
    `model = "${p.large}"`,
    `model_reasoning_effort = "xhigh"`,
    `'@`,
    `[System.IO.File]::WriteAllText($configFile, $tomlContent, $utf8NoBom)`,
    `Write-Host "  OK Đã ghi config.toml" -ForegroundColor Green`,
    ``,
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host "  Cấu hình hoàn tất!" -ForegroundColor Green`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host ""`,
    `Write-Host "Bước tiếp theo:" -ForegroundColor Cyan`,
    `Write-Host "  1. Khởi động lại PowerShell"`,
    `Write-Host "  2. Chạy: codex -V"`,
    `Write-Host "  3. Chạy: codex"`,
    `Write-Host ""`,
  ].filter(Boolean).join('\n');
}

function generateCodexCliUnix(p: {
  baseUrl: string;
  key: string;
  keyShort: string;
  small: string;
  medium: string;
  large: string;
}) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Thiết lập Api4Cheap cho Codex CLI"
echo "================================"
echo ""
echo "Endpoint:          ${p.baseUrl}"
echo "API Key:           ${p.keyShort}"
echo "Model nhỏ:         ${p.small}"
echo "Model trung bình:  ${p.medium}"
echo "Model lớn:         ${p.large}"
echo ""

echo "Đang kiểm tra điều kiện cài đặt..."
if command -v node &>/dev/null; then echo "  OK Node.js $(node --version)"; else echo "  CẢNH BÁO Không tìm thấy Node.js"; fi
if command -v npm &>/dev/null; then echo "  OK npm $(npm --version)"; else echo "  CẢNH BÁO Không tìm thấy npm"; fi

if command -v codex &>/dev/null; then
    echo ""; echo "Codex CLI đã được cài"
else
    echo ""; echo "Đang cài Codex CLI..."
    if command -v npm &>/dev/null; then
      npm install -g @openai/codex
    elif command -v brew &>/dev/null; then
      brew install codex
    else
      echo "  CẢNH BÁO Cần npm hoặc brew để tự động cài Codex"
    fi
fi

echo ""
echo "Đang cấu hình Codex CLI..."
CODEX_DIR="$HOME/.codex"
CONFIG_FILE="$CODEX_DIR/config.toml"
AUTH_FILE="$CODEX_DIR/auth.json"
mkdir -p "$CODEX_DIR"

CONFIG_BACKUP="$CODEX_DIR/config.toml.api4cheap-backup"
AUTH_BACKUP="$CODEX_DIR/auth.json.api4cheap-backup"
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_BACKUP"
  echo "  Đã backup config.toml"
fi
if [ -f "$AUTH_FILE" ]; then
  cp "$AUTH_FILE" "$AUTH_BACKUP"
  echo "  Đã backup auth.json"
fi

cat > "$AUTH_FILE" << 'AUTHEOF'
{
  "OPENAI_API_KEY": "${p.key}"
}
AUTHEOF
echo "  OK Đã ghi auth.json"

cat > "$CONFIG_FILE" << 'TOMLEOF'
model_provider = "api4cheap"
model = "${p.medium}"
model_reasoning_effort = "medium"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "${p.baseUrl}"
wire_api = "responses"

[profiles.small]
model_provider = "api4cheap"
model = "${p.small}"
model_reasoning_effort = "low"

[profiles.medium]
model_provider = "api4cheap"
model = "${p.medium}"
model_reasoning_effort = "medium"

[profiles.large]
model_provider = "api4cheap"
model = "${p.large}"
model_reasoning_effort = "xhigh"
TOMLEOF
echo "  OK Đã ghi config.toml"

echo ""
echo "================================"
echo "  Cấu hình hoàn tất!"
echo "================================"
echo ""
echo "Bước tiếp theo:"
echo "  1. Khởi động lại terminal"
echo "  2. Chạy: codex -V"
echo "  3. Chạy: codex"
echo ""
`;
}

function generateVsCodeExtWindows(p: {
  baseUrl: string;
  key: string;
  keyShort: string;
  haiku: string;
  sonnet: string;
  opus: string;
  mainModel: string;
  effortLevel: string;
}) {
  return [
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host "  Thiết lập Api4Cheap cho VS Code Extension" -ForegroundColor Cyan`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host ""`,
    `Write-Host "Endpoint:       ${p.baseUrl}"`,
    `Write-Host "API Key:        ${p.keyShort}"`,
    `Write-Host "Model chính:    ${p.mainModel}"`,
    `Write-Host "Haiku:          ${p.haiku}"`,
    `Write-Host "Sonnet:         ${p.sonnet}"`,
    `Write-Host "Opus:           ${p.opus}"`,
    `Write-Host "Effort Level:   ${p.effortLevel}"`,
    `Write-Host ""`,
    ``,
    `$vsCodeSettingsDir = Join-Path $env:APPDATA "Code\\User"`,
    `$vsCodeSettingsFile = Join-Path $vsCodeSettingsDir "settings.json"`,
    `if (-not (Test-Path $vsCodeSettingsDir)) {`,
    `    Write-Host "  Thư mục VS Code User settings không tồn tại." -ForegroundColor Yellow`,
    `    Write-Host "  Đang tạo: $vsCodeSettingsDir" -ForegroundColor Yellow`,
    `    New-Item -ItemType Directory -Path $vsCodeSettingsDir -Force | Out-Null`,
    `}`,
    ``,
    `if (Test-Path $vsCodeSettingsFile) {`,
    `    $backupFile = "$vsCodeSettingsFile.api4cheap-backup"`,
    `    Copy-Item $vsCodeSettingsFile $backupFile -Force`,
    `    Write-Host "  Đã backup: $backupFile" -ForegroundColor Yellow`,
    `} else {`,
    `    '{}' | Out-File -FilePath $vsCodeSettingsFile -Encoding utf8`,
    `    Write-Host "  OK Đã tạo file settings.json mới" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host "Đang cập nhật VS Code settings.json..."`,
    `$settings = Get-Content $vsCodeSettingsFile -Raw | ConvertFrom-Json`,
    `if (-not $settings) { $settings = @{} }`,
    `$envVars = @(`,
    `    [PSCustomObject]@{ name = 'ANTHROPIC_BASE_URL'; value = '${p.baseUrl}' },`,
    `    [PSCustomObject]@{ name = 'ANTHROPIC_AUTH_TOKEN'; value = '${p.key}' },`,
    `    [PSCustomObject]@{ name = 'ANTHROPIC_MODEL'; value = '${p.sonnet}' },`,
    `    [PSCustomObject]@{ name = 'ANTHROPIC_SMALL_FAST_MODEL'; value = '${p.haiku}' },`,
    `    [PSCustomObject]@{ name = 'ANTHROPIC_DEFAULT_HAIKU_MODEL'; value = '${p.haiku}' },`,
    `    [PSCustomObject]@{ name = 'ANTHROPIC_DEFAULT_SONNET_MODEL'; value = '${p.sonnet}' },`,
    `    [PSCustomObject]@{ name = 'ANTHROPIC_DEFAULT_OPUS_MODEL'; value = '${p.opus}' },`,
    `    [PSCustomObject]@{ name = 'CLAUDE_CODE_SUBAGENT_MODEL'; value = '${p.haiku}' },`,
    `    [PSCustomObject]@{ name = 'CLAUDE_CODE_EFFORT_LEVEL'; value = '${p.effortLevel}' }`,
    `)`,
    `$settings | Add-Member -NotePropertyName 'claudeCode.environmentVariables' -NotePropertyValue $envVars -Force`,
    `$settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $vsCodeSettingsFile -Encoding utf8`,
    `Write-Host "  OK Đã cập nhật $vsCodeSettingsFile" -ForegroundColor Green`,
    `Write-Host ""`,
    ``,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host "  Cấu hình hoàn tất!" -ForegroundColor Green`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host ""`,
    `Write-Host "Bước tiếp theo:" -ForegroundColor Cyan`,
    `Write-Host "  1. Khởi động lại VS Code"`,
    `Write-Host "  2. Mở Claude Code extension và kiểm tra /status"`,
    `Write-Host ""`,
  ].filter(Boolean).join('\n');
}

function generateVsCodeExtUnix(p: {
  baseUrl: string;
  key: string;
  keyShort: string;
  haiku: string;
  sonnet: string;
  opus: string;
  mainModel: string;
  effortLevel: string;
}) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Thiết lập Api4Cheap cho VS Code Extension"
echo "================================"
echo ""
echo "Endpoint:       ${p.baseUrl}"
echo "API Key:        ${p.keyShort}"
echo "Model chính:    ${p.mainModel}"
echo "Haiku:          ${p.haiku}"
echo "Sonnet:         ${p.sonnet}"
echo "Opus:           ${p.opus}"
echo "Effort Level:   ${p.effortLevel}"
echo ""

if [ "$(uname)" = "Darwin" ]; then
  VSCODE_DIR="$HOME/Library/Application Support/Code/User"
else
  VSCODE_DIR="$HOME/.config/Code/User"
fi
VSCODE_SETTINGS="$VSCODE_DIR/settings.json"

if [ ! -d "$VSCODE_DIR" ]; then
  echo "  Thư mục VS Code User settings không tồn tại."
  echo "  Đang tạo: $VSCODE_DIR"
  mkdir -p "$VSCODE_DIR"
fi

if [ -f "$VSCODE_SETTINGS" ]; then
  cp "$VSCODE_SETTINGS" "$VSCODE_SETTINGS.api4cheap-backup"
  echo "  Đã backup: $VSCODE_SETTINGS.api4cheap-backup"
else
  echo '{}' > "$VSCODE_SETTINGS"
  echo "  OK Đã tạo file settings.json mới"
fi

echo "Đang cập nhật VS Code settings.json..."
if command -v node >/dev/null 2>&1; then
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    let settings = {};
    try { settings = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
    settings["claudeCode.environmentVariables"] = [
      { name: "ANTHROPIC_BASE_URL", value: process.argv[2] },
      { name: "ANTHROPIC_AUTH_TOKEN", value: process.argv[3] },
      { name: "ANTHROPIC_MODEL", value: process.argv[5] },
      { name: "ANTHROPIC_SMALL_FAST_MODEL", value: process.argv[4] },
      { name: "ANTHROPIC_DEFAULT_HAIKU_MODEL", value: process.argv[4] },
      { name: "ANTHROPIC_DEFAULT_SONNET_MODEL", value: process.argv[5] },
      { name: "ANTHROPIC_DEFAULT_OPUS_MODEL", value: process.argv[6] },
      { name: "CLAUDE_CODE_SUBAGENT_MODEL", value: process.argv[4] },
      { name: "CLAUDE_CODE_EFFORT_LEVEL", value: process.argv[7] }
    ];
    fs.writeFileSync(file, JSON.stringify(settings, null, 2) + "\\n", "utf8");
  ' "$VSCODE_SETTINGS" "${p.baseUrl}" "${p.key}" "${p.mainModel}" "${p.haiku}" "${p.sonnet}" "${p.opus}" "${p.effortLevel}"
  echo "  OK Đã cập nhật $VSCODE_SETTINGS"
else
  echo "  CẢNH BÁO Cần Node.js để cập nhật JSON tự động."
  echo "  Vui lòng thêm thủ công vào $VSCODE_SETTINGS:"
  echo ""
  cat << JSONEOF
{
  "claudeCode.environmentVariables": [
    { "name": "ANTHROPIC_BASE_URL", "value": "${p.baseUrl}" },
    { "name": "ANTHROPIC_AUTH_TOKEN", "value": "${p.key}" },
    { "name": "ANTHROPIC_MODEL", "value": "${p.sonnet}" },
    { "name": "ANTHROPIC_SMALL_FAST_MODEL", "value": "${p.haiku}" },
    { "name": "ANTHROPIC_DEFAULT_HAIKU_MODEL", "value": "${p.haiku}" },
    { "name": "ANTHROPIC_DEFAULT_SONNET_MODEL", "value": "${p.sonnet}" },
    { "name": "ANTHROPIC_DEFAULT_OPUS_MODEL", "value": "${p.opus}" },
    { "name": "CLAUDE_CODE_SUBAGENT_MODEL", "value": "${p.haiku}" },
    { "name": "CLAUDE_CODE_EFFORT_LEVEL", "value": "${p.effortLevel}" },
    { "name": "ANTHROPIC_DISABLE_INTERLEAVED_STREAMING", "value": "1" },
    { "name": "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "value": "1" }
  ]
}
JSONEOF
fi

echo ""
echo "================================"
echo "  Cấu hình hoàn tất!"
echo "================================"
echo ""
echo "Bước tiếp theo:"
echo "  1. Khởi động lại VS Code"
echo "  2. Mở Claude Code extension và kiểm tra /status"
echo ""
`;
}
