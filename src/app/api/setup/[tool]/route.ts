import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/setup/:tool?key=...&os=windows|mac
 * GET /api/v1/setup/:tool?key=...&os=windows|mac
 * Returns a PowerShell or Bash script for Claude Code or Codex CLI.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;
  const url = new URL(req.url);
  const key = clean(url.searchParams.get('key'), 'YOUR_API_KEY');
  const os = url.searchParams.get('os') || 'windows';
  const baseUrl = 'https://lccaptcha.io.vn';
  const claudeBaseUrl = baseUrl;
  const codexBaseUrl = baseUrl;
  const keyShort = key.slice(0, 8) + '...';
  const claudeModels = {
    haiku: clean(url.searchParams.get('haiku'), 'claude-haiku-4-5-20251001'),
    sonnet: clean(url.searchParams.get('sonnet'), 'claude-sonnet-4-6'),
    opus: clean(url.searchParams.get('opus'), 'claude-opus-4-6'),
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
    default:
      return NextResponse.json({ error: 'Unknown tool' }, { status: 404 });
  }

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function clean(value: string | null, fallback: string) {
  const cleaned = (value || fallback).replace(/[\r\n]/g, '').trim();
  return cleaned || fallback;
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
Write-Host "  Api4Cheap Claude Code Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: ${p.baseUrl}"
Write-Host "API Key:  ${p.keyShort}"
Write-Host "Haiku:    ${p.haiku}"
Write-Host "Sonnet:   ${p.sonnet}"
Write-Host "Opus:     ${p.opus}"
Write-Host ""

Write-Host "Checking prerequisites..."
$nodeV = node --version 2>$null
if ($nodeV) { Write-Host "  OK Node.js $nodeV" -ForegroundColor Green } else { Write-Host "  WARN Node.js 18+ is required" -ForegroundColor Yellow }
$npmV = npm --version 2>$null
if ($npmV) { Write-Host "  OK npm $npmV" -ForegroundColor Green } else { Write-Host "  WARN npm is required to install Claude Code" -ForegroundColor Yellow }

$claudePath = Get-Command claude -ErrorAction SilentlyContinue
if ($claudePath) {
    Write-Host "  OK Claude Code already installed" -ForegroundColor Green
} elseif ($npmV) {
    Write-Host "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
}
Write-Host ""

$credFile = Join-Path (Join-Path $env:USERPROFILE ".claude") ".credentials.json"
if (Test-Path $credFile) {
    Remove-Item $credFile -Force
    Write-Host "  OK Deleted .credentials.json (old login)" -ForegroundColor Yellow
}
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
$env:ANTHROPIC_AUTH_TOKEN = $null
Write-Host "  OK Cleared ANTHROPIC_AUTH_TOKEN" -ForegroundColor Yellow
Write-Host ""

Write-Host "Configuring Claude Code settings..."
$claudeDir = Join-Path $env:USERPROFILE ".claude"
$settingsFile = Join-Path $claudeDir "settings.json"
if (-not (Test-Path $claudeDir)) { New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null }

if (Test-Path $settingsFile) {
    $bk = Join-Path $claudeDir "settings.json.api4cheap-backup"
    Copy-Item $settingsFile $bk -Force
    Write-Host "  Backed up: $settingsFile" -ForegroundColor Yellow
}

$settingsContent = @'
{
    "model": "sonnet",
    "env": {
        "ANTHROPIC_API_KEY": "${p.key}",
        "ANTHROPIC_BASE_URL": "${p.baseUrl}",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${p.haiku}",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "${p.sonnet}",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "${p.opus}",
        "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY": "1",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
        "allow": [],
        "deny": []
    }
}
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($settingsFile, $settingsContent, $utf8NoBom)
Write-Host "  OK Updated $settingsFile" -ForegroundColor Green
Write-Host ""

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart PowerShell"
Write-Host "  2. Run: claude"
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
echo "  Api4Cheap Claude Code Setup"
echo "================================"
echo ""
echo "Endpoint: ${p.baseUrl}"
echo "API Key:  ${p.keyShort}"
echo "Haiku:    ${p.haiku}"
echo "Sonnet:   ${p.sonnet}"
echo "Opus:     ${p.opus}"
echo ""

echo "Checking prerequisites..."
if command -v node >/dev/null 2>&1; then echo "  OK Node.js $(node --version)"; else echo "  WARN Node.js 18+ is required"; fi
if command -v npm >/dev/null 2>&1; then echo "  OK npm $(npm --version)"; else echo "  WARN npm is required to install Claude Code"; fi

if command -v claude >/dev/null 2>&1; then
  echo "  OK Claude Code already installed"
elif command -v npm >/dev/null 2>&1; then
  echo "Installing Claude Code..."
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
    "model": "sonnet",
    "env": {
        "ANTHROPIC_API_KEY": "${p.key}",
        "ANTHROPIC_BASE_URL": "${p.baseUrl}",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${p.haiku}",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "${p.sonnet}",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "${p.opus}",
        "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY": "1",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
        "allow": [],
        "deny": []
    }
}
SETTINGSEOF

echo "  OK Updated settings.json"

echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Restart terminal"
echo "  2. Run: claude"
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
    `Write-Host "  Api4Cheap Codex CLI Setup" -ForegroundColor Cyan`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host ""`,
    `Write-Host "Endpoint:          ${p.baseUrl}"`,
    `Write-Host "API Key:           ${p.keyShort}"`,
    `Write-Host "Small model:       ${p.small}"`,
    `Write-Host "Medium model:      ${p.medium}"`,
    `Write-Host "Large model:       ${p.large}"`,
    `Write-Host ""`,
    ``,
    `Write-Host "Checking prerequisites..."`,
    `$nodeV = node --version 2>$null`,
    `if ($nodeV) { Write-Host "  OK Node.js $nodeV" -ForegroundColor Green } else { Write-Host "  WARN Node.js not found" -ForegroundColor Yellow }`,
    `$npmV = npm --version 2>$null`,
    `if ($npmV) { Write-Host "  OK npm $npmV" -ForegroundColor Green } else { Write-Host "  WARN npm not found" -ForegroundColor Yellow }`,
    ``,
    `$codexPath = Get-Command codex -ErrorAction SilentlyContinue`,
    `if ($codexPath) { Write-Host "  OK Codex CLI already installed" -ForegroundColor Green } else {`,
    `    Write-Host "Installing Codex CLI..." -ForegroundColor Yellow`,
    `    npm install -g @openai/codex`,
    `    if ($?) { Write-Host "  OK Installed" -ForegroundColor Green } else { Write-Host "  FAIL Install failed" -ForegroundColor Red }`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "Configuring Codex CLI..."`,
    `$codexDir = Join-Path $env:USERPROFILE ".codex"`,
    `$configFile = Join-Path $codexDir "config.toml"`,
    `$authFile = Join-Path $codexDir "auth.json"`,
    `New-Item -ItemType Directory -Path $codexDir -Force | Out-Null`,
    `$configBackup = Join-Path $codexDir "config.toml.api4cheap-backup"`,
    `$authBackup = Join-Path $codexDir "auth.json.api4cheap-backup"`,
    `if (Test-Path $configFile) {`,
    `    Copy-Item -LiteralPath $configFile -Destination $configBackup -Force`,
    `    Write-Host "  Backed up config.toml" -ForegroundColor Yellow`,
    `}`,
    `if (Test-Path $authFile) {`,
    `    Copy-Item -LiteralPath $authFile -Destination $authBackup -Force`,
    `    Write-Host "  Backed up auth.json" -ForegroundColor Yellow`,
    `}`,
    ``,
    `$utf8NoBom = New-Object System.Text.UTF8Encoding $false`,
    `$authContent = @'`,
    JSON.stringify({ OPENAI_API_KEY: p.key }, null, 2),
    `'@`,
    `[System.IO.File]::WriteAllText($authFile, $authContent, $utf8NoBom)`,
    `Write-Host "  OK Written auth.json" -ForegroundColor Green`,
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
    `Write-Host "  OK Written config.toml" -ForegroundColor Green`,
    ``,
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host "  Configuration Complete!" -ForegroundColor Green`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host ""`,
    `Write-Host "Next steps:" -ForegroundColor Cyan`,
    `Write-Host "  1. Restart PowerShell"`,
    `Write-Host "  2. Run: codex -V"`,
    `Write-Host "  3. Run: codex"`,
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
echo "  Api4Cheap Codex CLI Setup"
echo "================================"
echo ""
echo "Endpoint:          ${p.baseUrl}"
echo "API Key:           ${p.keyShort}"
echo "Small model:       ${p.small}"
echo "Medium model:      ${p.medium}"
echo "Large model:       ${p.large}"
echo ""

echo "Checking prerequisites..."
if command -v node &>/dev/null; then echo "  OK Node.js $(node --version)"; else echo "  WARN Node.js not found"; fi
if command -v npm &>/dev/null; then echo "  OK npm $(npm --version)"; else echo "  WARN npm not found"; fi

if command -v codex &>/dev/null; then
    echo ""; echo "Codex CLI already installed"
else
    echo ""; echo "Installing Codex CLI..."
    if command -v npm &>/dev/null; then
      npm install -g @openai/codex
    elif command -v brew &>/dev/null; then
      brew install codex
    else
      echo "  WARN npm or brew is required to install Codex automatically"
    fi
fi

echo ""
echo "Configuring Codex CLI..."
CODEX_DIR="$HOME/.codex"
CONFIG_FILE="$CODEX_DIR/config.toml"
AUTH_FILE="$CODEX_DIR/auth.json"
mkdir -p "$CODEX_DIR"

CONFIG_BACKUP="$CODEX_DIR/config.toml.api4cheap-backup"
AUTH_BACKUP="$CODEX_DIR/auth.json.api4cheap-backup"
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_BACKUP"
  echo "  Backed up config.toml"
fi
if [ -f "$AUTH_FILE" ]; then
  cp "$AUTH_FILE" "$AUTH_BACKUP"
  echo "  Backed up auth.json"
fi

cat > "$AUTH_FILE" << 'AUTHEOF'
{
  "OPENAI_API_KEY": "${p.key}"
}
AUTHEOF
echo "  OK Written auth.json"

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
echo "  OK Written config.toml"

echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Restart terminal"
echo "  2. Run: codex -V"
echo "  3. Run: codex"
echo ""
`;
}
