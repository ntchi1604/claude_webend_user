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
    `$backupDir = "$codexDir.api4cheap-backup"`,
    `$configFile = Join-Path $codexDir "config.toml"`,
    `$oldBackup = Join-Path $codexDir "config.toml.api4cheap-backup"`,
    `if (Test-Path $backupDir) {`,
    `    if (Test-Path $codexDir) { Remove-Item -LiteralPath $codexDir -Recurse -Force }`,
    `    Move-Item -LiteralPath $backupDir -Destination $codexDir -Force`,
    `    Write-Host "  OK Restored .codex backup" -ForegroundColor Green`,
    `} elseif (Test-Path $oldBackup) {`,
    `    Copy-Item $oldBackup $configFile -Force`,
    `    Remove-Item $oldBackup -Force`,
    `    Write-Host "  OK Restored config.toml" -ForegroundColor Green`,
    `} elseif (Test-Path $codexDir) {`,
    `    Remove-Item -LiteralPath $codexDir -Recurse -Force`,
    `    Write-Host "  OK Removed .codex" -ForegroundColor Green`,
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
BACKUP_DIR="$HOME/.codex.api4cheap-backup"
OLD_BACKUP="$CODEX_DIR/config.toml.api4cheap-backup"
if [ -d "$BACKUP_DIR" ]; then
  rm -rf "$CODEX_DIR"
  mv "$BACKUP_DIR" "$CODEX_DIR"
  echo "  OK Restored .codex backup"
elif [ -f "$OLD_BACKUP" ]; then
  mv "$OLD_BACKUP" "$CONFIG_FILE"
  echo "  OK Restored config.toml"
elif [ -d "$CODEX_DIR" ]; then
  rm -rf "$CODEX_DIR"
  echo "  OK Removed .codex"
fi

echo ""
echo "  Uninstall Complete!"
echo ""
`;
}
