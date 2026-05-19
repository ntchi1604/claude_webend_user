import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/setup/:tool/uninstall?os=windows|mac
 * Returns a PowerShell or Bash cleanup script for Claude Code or Codex CLI.
 */
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
    case 'codex-cli':
      script = os === 'windows' ? uninstallCodexCliWindows() : uninstallCodexCliUnix();
      break;
    default:
      return NextResponse.json({ error: 'Unknown tool' }, { status: 404 });
  }

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function uninstallClaudeCodeWindows() {
  return [
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Api4Cheap Claude Code Uninstall" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")`,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")`,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")`,
    `$env:ANTHROPIC_BASE_URL = $null`,
    `$env:ANTHROPIC_API_KEY = $null`,
    `$env:ANTHROPIC_AUTH_TOKEN = $null`,
    `Write-Host "  OK Removed Claude Code env vars" -ForegroundColor Green`,
    ``,
    `$claudeDir = Join-Path $env:USERPROFILE ".claude"`,
    `$settingsFile = Join-Path $claudeDir "settings.json"`,
    `$backupFile = Join-Path $claudeDir "settings.json.api4cheap-backup"`,
    `if (Test-Path $backupFile) {`,
    `    Copy-Item $backupFile $settingsFile -Force`,
    `    Remove-Item $backupFile -Force`,
    `    Write-Host "  OK Restored settings.json" -ForegroundColor Green`,
    `} elseif (Test-Path $settingsFile) {`,
    `    Remove-Item $settingsFile -Force`,
    `    Write-Host "  OK Removed settings.json" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "  Uninstall Complete!" -ForegroundColor Green`,
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

PROFILE=""
if [ -f "$HOME/.zshrc" ]; then PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then PROFILE="$HOME/.profile"
fi

if [ -n "$PROFILE" ]; then
  sed -i.bak '/ANTHROPIC_BASE_URL/d; /ANTHROPIC_API_KEY/d; /ANTHROPIC_AUTH_TOKEN/d; /# Api4Cheap/d' "$PROFILE"
  echo "  OK Cleaned $PROFILE"
fi

unset ANTHROPIC_BASE_URL
unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN

CLAUDE_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
BACKUP_FILE="$CLAUDE_DIR/settings.json.api4cheap-backup"
if [ -f "$BACKUP_FILE" ]; then
  mv "$BACKUP_FILE" "$SETTINGS_FILE"
  echo "  OK Restored settings.json"
elif [ -f "$SETTINGS_FILE" ]; then
  rm -f "$SETTINGS_FILE"
  echo "  OK Removed settings.json"
fi

echo ""
echo "  Uninstall Complete!"
echo "Run: claude login"
echo ""
`;
}

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
    `$configFile = Join-Path $codexDir "config.toml"`,
    `$authFile = Join-Path $codexDir "auth.json"`,
    `$configBackup = Join-Path $codexDir "config.toml.api4cheap-backup"`,
    `$authBackup = Join-Path $codexDir "auth.json.api4cheap-backup"`,
    `if (Test-Path $configBackup) {`,
    `    Copy-Item -LiteralPath $configBackup -Destination $configFile -Force`,
    `    Remove-Item -LiteralPath $configBackup -Force`,
    `    Write-Host "  OK Restored config.toml" -ForegroundColor Green`,
    `} elseif (Test-Path $configFile) {`,
    `    Remove-Item -LiteralPath $configFile -Force`,
    `    Write-Host "  OK Removed config.toml" -ForegroundColor Green`,
    `}`,
    `if (Test-Path $authBackup) {`,
    `    Copy-Item -LiteralPath $authBackup -Destination $authFile -Force`,
    `    Remove-Item -LiteralPath $authBackup -Force`,
    `    Write-Host "  OK Restored auth.json" -ForegroundColor Green`,
    `} elseif (Test-Path $authFile) {`,
    `    Remove-Item -LiteralPath $authFile -Force`,
    `    Write-Host "  OK Removed auth.json" -ForegroundColor Green`,
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
CONFIG_FILE="$CODEX_DIR/config.toml"
AUTH_FILE="$CODEX_DIR/auth.json"
CONFIG_BACKUP="$CODEX_DIR/config.toml.api4cheap-backup"
AUTH_BACKUP="$CODEX_DIR/auth.json.api4cheap-backup"
if [ -f "$CONFIG_BACKUP" ]; then
  mv "$CONFIG_BACKUP" "$CONFIG_FILE"
  echo "  OK Restored config.toml"
elif [ -f "$CONFIG_FILE" ]; then
  rm -f "$CONFIG_FILE"
  echo "  OK Removed config.toml"
fi
if [ -f "$AUTH_BACKUP" ]; then
  mv "$AUTH_BACKUP" "$AUTH_FILE"
  echo "  OK Restored auth.json"
elif [ -f "$AUTH_FILE" ]; then
  rm -f "$AUTH_FILE"
  echo "  OK Removed auth.json"
fi

echo ""
echo "  Uninstall Complete!"
echo ""
`;
}
