import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;
  const url = new URL(req.url);
  const os = url.searchParams.get('os') || 'windows';

  let script = '';

  switch (tool) {
    case 'claude-code':
      script = os === 'windows' ? uninstallClaudeCodeWindows() : uninstallClaudeCodeUnix();
      break;
    case 'openclaw':
      script = os === 'windows' ? uninstallOpenClawWindows() : uninstallOpenClawUnix();
      break;
    case 'codex-cli':
      script = os === 'windows' ? uninstallCodexCliWindows() : uninstallCodexCliUnix();
      break;
    case 'hermes-agent':
      script = os === 'windows' ? uninstallHermesWindows() : uninstallHermesUnix();
      break;
    default:
      return NextResponse.json({ error: 'Unknown tool' }, { status: 404 });
  }

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// ─── Claude Code ───
function uninstallClaudeCodeWindows() {
  return [
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Api4Cheap Claude Code Uninstall" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")`,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")`,
    `$env:ANTHROPIC_BASE_URL = $null`,
    `$env:ANTHROPIC_API_KEY = $null`,
    `Write-Host "  OK Removed env vars" -ForegroundColor Green`,
    ``,
    `$claudeDir = Join-Path $env:USERPROFILE ".claude"`,
    `$sf = Join-Path $claudeDir "settings.json"`,
    `$bk = Join-Path $claudeDir "settings.json.api4cheap-backup"`,
    `if (Test-Path $bk) {`,
    `    Copy-Item $bk $sf -Force; Remove-Item $bk -Force`,
    `    Write-Host "  OK Restored settings.json" -ForegroundColor Green`,
    `} elseif (Test-Path $sf) {`,
    `    Remove-Item $sf -Force`,
    `    Write-Host "  OK Removed settings.json" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host "  Uninstall Complete!" -ForegroundColor Green`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host ""`,
    `Write-Host "Run: claude login"`,
    `Write-Host ""`,
  ].join('\n');
}

function uninstallClaudeCodeUnix() {
  return `#!/bin/bash
echo "================================"
echo "  Api4Cheap Claude Code Uninstall"
echo "================================"
echo ""

# Remove env vars from profile
PROFILE=""
if [ -f "$HOME/.zshrc" ]; then PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then PROFILE="$HOME/.profile"
fi

if [ -n "$PROFILE" ]; then
  sed -i.bak '/ANTHROPIC_BASE_URL/d; /ANTHROPIC_API_KEY/d; /ANTHROPIC_AUTH_TOKEN/d; /ANTHROPIC_DEFAULT_.*_MODEL/d; /# Api4Cheap/d' "$PROFILE"
  echo "  OK Cleaned $PROFILE"
fi

unset ANTHROPIC_BASE_URL
unset ANTHROPIC_API_KEY

CLAUDE_DIR="$HOME/.claude"
SF="$CLAUDE_DIR/settings.json"
BK="$CLAUDE_DIR/settings.json.api4cheap-backup"
if [ -f "$BK" ]; then
  mv "$BK" "$SF"
  echo "  OK Restored settings.json"
elif [ -f "$SF" ]; then
  rm -f "$SF"
  echo "  OK Removed settings.json"
fi

echo ""
echo "  Uninstall Complete!"
echo ""
echo "Run: claude login"
echo ""
`;
}

// ─── OpenClaw ───
function uninstallOpenClawWindows() {
  return [
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Api4Cheap OpenClaw Uninstall" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `[System.Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", $null, "User")`,
    `[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", $null, "User")`,
    `$env:OPENAI_BASE_URL = $null`,
    `$env:OPENAI_API_KEY = $null`,
    `Write-Host "  OK Removed env vars" -ForegroundColor Green`,
    ``,
    `$ocDir = Join-Path $env:USERPROFILE ".openclaw"`,
    `$ef = Join-Path $ocDir ".env"`,
    `$bk = Join-Path $ocDir ".env.api4cheap-backup"`,
    `if (Test-Path $bk) {`,
    `    Copy-Item $bk $ef -Force; Remove-Item $bk -Force`,
    `    Write-Host "  OK Restored .env" -ForegroundColor Green`,
    `} elseif (Test-Path $ef) {`,
    `    Remove-Item $ef -Force`,
    `    Write-Host "  OK Removed .env" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "  Uninstall Complete!" -ForegroundColor Green`,
    `Write-Host ""`,
  ].join('\n');
}

function uninstallOpenClawUnix() {
  return `#!/bin/bash
echo "================================"
echo "  Api4Cheap OpenClaw Uninstall"
echo "================================"
echo ""

PROFILE=""
if [ -f "$HOME/.zshrc" ]; then PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then PROFILE="$HOME/.profile"
fi

if [ -n "$PROFILE" ]; then
  sed -i.bak '/OPENAI_BASE_URL/d; /OPENAI_API_KEY/d; /# Api4Cheap/d' "$PROFILE"
  echo "  OK Cleaned $PROFILE"
fi

OC_DIR="$HOME/.openclaw"
EF="$OC_DIR/.env"
BK="$OC_DIR/.env.api4cheap-backup"
if [ -f "$BK" ]; then
  mv "$BK" "$EF"
  echo "  OK Restored .env"
elif [ -f "$EF" ]; then
  rm -f "$EF"
  echo "  OK Removed .env"
fi

echo ""
echo "  Uninstall Complete!"
echo ""
`;
}

// ─── Codex CLI ───
function uninstallCodexCliWindows() {
  return [
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Api4Cheap Codex CLI Uninstall" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", $null, "User")`,
    `$env:OPENAI_API_KEY = $null`,
    `Write-Host "  OK Removed OPENAI_API_KEY" -ForegroundColor Green`,
    ``,
    `$codexDir = Join-Path $env:USERPROFILE ".codex"`,
    `$cf = Join-Path $codexDir "config.toml"`,
    `$bk = Join-Path $codexDir "config.toml.api4cheap-backup"`,
    `if (Test-Path $bk) {`,
    `    Copy-Item $bk $cf -Force; Remove-Item $bk -Force`,
    `    Write-Host "  OK Restored config.toml" -ForegroundColor Green`,
    `} elseif (Test-Path $cf) {`,
    `    Remove-Item $cf -Force`,
    `    Write-Host "  OK Removed config.toml" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "  Uninstall Complete!" -ForegroundColor Green`,
    `Write-Host ""`,
  ].join('\n');
}

function uninstallCodexCliUnix() {
  return `#!/bin/bash
echo "================================"
echo "  Api4Cheap Codex CLI Uninstall"
echo "================================"
echo ""

CODEX_DIR="$HOME/.codex"
CF="$CODEX_DIR/config.toml"
BK="$CODEX_DIR/config.toml.api4cheap-backup"
if [ -f "$BK" ]; then
  mv "$BK" "$CF"
  echo "  OK Restored config.toml"
elif [ -f "$CF" ]; then
  rm -f "$CF"
  echo "  OK Removed config.toml"
fi

echo ""
echo "  Uninstall Complete!"
echo ""
`;
}

// ─── Hermes ───
function uninstallHermesWindows() {
  return [
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Api4Cheap Hermes Agent Uninstall" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `# Check WSL`,
    `$wslPath = Get-Command wsl.exe -ErrorAction SilentlyContinue`,
    `if (-not $wslPath) {`,
    `    Write-Host "WSL2 not found - nothing to uninstall." -ForegroundColor Yellow`,
    `    exit 0`,
    `}`,
    ``,
    `Write-Host "Running uninstall inside WSL..." -ForegroundColor Yellow`,
    `$bashCmd = @'`,
    `HERMES_DIR="$HOME/.hermes"`,
    `CF="$HERMES_DIR/config.yaml"`,
    `BK="$HERMES_DIR/config.yaml.api4cheap-backup"`,
    ``,
    `if [ -f "$BK" ]; then`,
    `    mv "$BK" "$CF"`,
    `    echo "  Restored config.yaml"`,
    `elif [ -f "$CF" ]; then`,
    `    rm -f "$CF"`,
    `    echo "  Removed config.yaml"`,
    `fi`,
    ``,
    `echo ""`,
    `echo "  Uninstall Complete!"`,
    `echo ""`,
    `'@`,
    `wsl bash -c $bashCmd`,
    ``,
    `Write-Host ""`,
    `Write-Host "  Uninstall Complete!" -ForegroundColor Green`,
    `Write-Host ""`,
  ].join('\n');
}

function uninstallHermesUnix() {
  return `#!/bin/bash
echo "================================"
echo "  Api4Cheap Hermes Agent Uninstall"
echo "================================"
echo ""

HERMES_DIR="$HOME/.hermes"
CF="$HERMES_DIR/config.yaml"
BK="$HERMES_DIR/config.yaml.api4cheap-backup"

if [ -f "$BK" ]; then
  mv "$BK" "$CF"
  echo "  OK Restored config.yaml"
elif [ -f "$CF" ]; then
  rm -f "$CF"
  echo "  OK Removed config.yaml"
fi

echo ""
echo "  Uninstall Complete!"
echo ""
`;
}
