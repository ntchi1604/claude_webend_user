import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/setup/:tool?key=...&os=windows|mac
 * Returns a PowerShell or Bash script for Claude Code or Codex CLI.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || 'YOUR_API_KEY';
  const os = url.searchParams.get('os') || 'windows';
  const baseUrl = process.env.GATEWAY_BASE_URL || process.env.APP_URL || 'https://lccaptcha.io.vn';
  const claudeBaseUrl = process.env.CLAUDE_CODE_BASE_URL || baseUrl;
  const codexBaseUrl = process.env.CODEX_BASE_URL || baseUrl;
  const keyShort = key.slice(0, 8) + '...';

  let script = '';

  switch (tool) {
    case 'claude-code':
      script = os === 'windows'
        ? generateClaudeCodeWindows({ baseUrl: claudeBaseUrl, key, keyShort })
        : generateClaudeCodeUnix({ baseUrl: claudeBaseUrl, key, keyShort });
      break;
    case 'codex-cli':
      script = os === 'windows'
        ? generateCodexCliWindows({ baseUrl: codexBaseUrl, key, keyShort })
        : generateCodexCliUnix({ baseUrl: codexBaseUrl, key, keyShort });
      break;
    default:
      return NextResponse.json({ error: 'Unknown tool' }, { status: 404 });
  }

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function generateClaudeCodeWindows(p: { baseUrl: string; key: string; keyShort: string }) {
  return `Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Api4Cheap Claude Code Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: ${p.baseUrl}"
Write-Host "API Key:  ${p.keyShort}"
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
    "env": {
        "ANTHROPIC_API_KEY": "${p.key}",
        "ANTHROPIC_BASE_URL": "${p.baseUrl}",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
        "allow": [],
        "deny": []
    },
    "apiKeyHelper": "echo '${p.key}'"
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

function generateClaudeCodeUnix(p: { baseUrl: string; key: string; keyShort: string }) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap Claude Code Setup"
echo "================================"
echo ""
echo "Endpoint: ${p.baseUrl}"
echo "API Key:  ${p.keyShort}"
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
    "env": {
        "ANTHROPIC_API_KEY": "${p.key}",
        "ANTHROPIC_BASE_URL": "${p.baseUrl}",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
        "allow": [],
        "deny": []
    },
    "apiKeyHelper": "echo '${p.key}'"
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

function generateCodexCliWindows(p: { baseUrl: string; key: string; keyShort: string }) {
  return [
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host "  Api4Cheap Codex CLI Setup" -ForegroundColor Cyan`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host ""`,
    `Write-Host "Endpoint:          ${p.baseUrl}"`,
    `Write-Host "API Key:           ${p.keyShort}"`,
    `Write-Host "Model:             gpt-5.5"`,
    `Write-Host "Reasoning effort:  xhigh"`,
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
    `$backupDir = "$codexDir.api4cheap-backup"`,
    `if (Test-Path $backupDir) { Remove-Item -LiteralPath $backupDir -Recurse -Force }`,
    `if (Test-Path $codexDir) {`,
    `    Move-Item -LiteralPath $codexDir -Destination $backupDir -Force`,
    `    Write-Host "  Backed up existing .codex to $backupDir" -ForegroundColor Yellow`,
    `}`,
    `New-Item -ItemType Directory -Path $codexDir -Force | Out-Null`,
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
    `model = "gpt-5.5"`,
    `model_reasoning_effort = "xhigh"`,
    `disable_response_storage = true`,
    `preferred_auth_method = "apikey"`,
    ``,
    `[model_providers.api4cheap]`,
    `name = "Api4Cheap"`,
    `base_url = "${p.baseUrl}"`,
    `wire_api = "responses"`,
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

function generateCodexCliUnix(p: { baseUrl: string; key: string; keyShort: string }) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap Codex CLI Setup"
echo "================================"
echo ""
echo "Endpoint:          ${p.baseUrl}"
echo "API Key:           ${p.keyShort}"
echo "Model:             gpt-5.5"
echo "Reasoning effort:  xhigh"
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
BACKUP_DIR="$HOME/.codex.api4cheap-backup"

rm -rf "$BACKUP_DIR"
if [ -d "$CODEX_DIR" ]; then
  mv "$CODEX_DIR" "$BACKUP_DIR"
  echo "  Backed up existing .codex to $BACKUP_DIR"
fi
mkdir -p "$CODEX_DIR"

cat > "$AUTH_FILE" << 'AUTHEOF'
{
  "OPENAI_API_KEY": "${p.key}"
}
AUTHEOF
echo "  OK Written auth.json"

cat > "$CONFIG_FILE" << 'TOMLEOF'
model_provider = "api4cheap"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "${p.baseUrl}"
wire_api = "responses"
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
