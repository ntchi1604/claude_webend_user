import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/setup/:tool/uninstall?os=windows|mac
 * Trả về script PowerShell hoặc Bash để gỡ cấu hình Claude Code, Codex CLI hoặc VS Code Extension.
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
    case 'vscode-ext':
      script = os === 'windows' ? uninstallVsCodeExtWindows() : uninstallVsCodeExtUnix();
      break;
    default:
      return NextResponse.json({ error: 'Công cụ không được hỗ trợ' }, { status: 404 });
  }

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function uninstallClaudeCodeWindows() {
  return [
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Gỡ cấu hình Api4Cheap cho Claude Code" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")`,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")`,
    `[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")`,
    `$env:ANTHROPIC_BASE_URL = $null`,
    `$env:ANTHROPIC_API_KEY = $null`,
    `$env:ANTHROPIC_AUTH_TOKEN = $null`,
    `Write-Host "  OK Đã xoá biến môi trường Claude Code" -ForegroundColor Green`,
    ``,
    `$claudeDir = Join-Path $env:USERPROFILE ".claude"`,
    `$settingsFile = Join-Path $claudeDir "settings.json"`,
    `$backupFile = Join-Path $claudeDir "settings.json.api4cheap-backup"`,
    `if (Test-Path $backupFile) {`,
    `    Copy-Item $backupFile $settingsFile -Force`,
    `    Remove-Item $backupFile -Force`,
    `    Write-Host "  OK Đã khôi phục settings.json" -ForegroundColor Green`,
    `} elseif (Test-Path $settingsFile) {`,
    `    Remove-Item $settingsFile -Force`,
    `    Write-Host "  OK Đã xoá settings.json" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "  Gỡ cấu hình hoàn tất!" -ForegroundColor Green`,
    `Write-Host "Chạy: claude login"`,
    `Write-Host ""`,
  ].join('\n');
}

function uninstallClaudeCodeUnix() {
  return `#!/bin/bash
echo "================================"
echo "  Gỡ cấu hình Api4Cheap cho Claude Code"
echo "================================"
echo ""

PROFILE=""
if [ -f "$HOME/.zshrc" ]; then PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then PROFILE="$HOME/.profile"
fi

if [ -n "$PROFILE" ]; then
  sed -i.bak '/ANTHROPIC_BASE_URL/d; /ANTHROPIC_API_KEY/d; /ANTHROPIC_AUTH_TOKEN/d; /# Api4Cheap/d' "$PROFILE"
  echo "  OK Đã dọn $PROFILE"
fi

unset ANTHROPIC_BASE_URL
unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN

CLAUDE_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
BACKUP_FILE="$CLAUDE_DIR/settings.json.api4cheap-backup"
if [ -f "$BACKUP_FILE" ]; then
  mv "$BACKUP_FILE" "$SETTINGS_FILE"
  echo "  OK Đã khôi phục settings.json"
elif [ -f "$SETTINGS_FILE" ]; then
  rm -f "$SETTINGS_FILE"
  echo "  OK Đã xoá settings.json"
fi

echo ""
echo "  Gỡ cấu hình hoàn tất!"
echo "Chạy: claude login"
echo ""
`;
}

function uninstallCodexCliWindows() {
  return [
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Gỡ cấu hình Api4Cheap cho Codex CLI" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", $null, "User")`,
    `$env:OPENAI_API_KEY = $null`,
    `Write-Host "  OK Đã xoá OPENAI_API_KEY" -ForegroundColor Green`,
    ``,
    `$codexDir = Join-Path $env:USERPROFILE ".codex"`,
    `$configFile = Join-Path $codexDir "config.toml"`,
    `$authFile = Join-Path $codexDir "auth.json"`,
    `$configBackup = Join-Path $codexDir "config.toml.api4cheap-backup"`,
    `$authBackup = Join-Path $codexDir "auth.json.api4cheap-backup"`,
    `if (Test-Path $configBackup) {`,
    `    Copy-Item -LiteralPath $configBackup -Destination $configFile -Force`,
    `    Remove-Item -LiteralPath $configBackup -Force`,
    `    Write-Host "  OK Đã khôi phục config.toml" -ForegroundColor Green`,
    `} elseif (Test-Path $configFile) {`,
    `    Remove-Item -LiteralPath $configFile -Force`,
    `    Write-Host "  OK Đã xoá config.toml" -ForegroundColor Green`,
    `}`,
    `if (Test-Path $authBackup) {`,
    `    Copy-Item -LiteralPath $authBackup -Destination $authFile -Force`,
    `    Remove-Item -LiteralPath $authBackup -Force`,
    `    Write-Host "  OK Đã khôi phục auth.json" -ForegroundColor Green`,
    `} elseif (Test-Path $authFile) {`,
    `    Remove-Item -LiteralPath $authFile -Force`,
    `    Write-Host "  OK Đã xoá auth.json" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "  Gỡ cấu hình hoàn tất!" -ForegroundColor Green`,
    `Write-Host ""`,
  ].join('\n');
}

function uninstallCodexCliUnix() {
  return `#!/bin/bash
echo "================================"
echo "  Gỡ cấu hình Api4Cheap cho Codex CLI"
echo "================================"
echo ""

CODEX_DIR="$HOME/.codex"
CONFIG_FILE="$CODEX_DIR/config.toml"
AUTH_FILE="$CODEX_DIR/auth.json"
CONFIG_BACKUP="$CODEX_DIR/config.toml.api4cheap-backup"
AUTH_BACKUP="$CODEX_DIR/auth.json.api4cheap-backup"
if [ -f "$CONFIG_BACKUP" ]; then
  mv "$CONFIG_BACKUP" "$CONFIG_FILE"
  echo "  OK Đã khôi phục config.toml"
elif [ -f "$CONFIG_FILE" ]; then
  rm -f "$CONFIG_FILE"
  echo "  OK Đã xoá config.toml"
fi
if [ -f "$AUTH_BACKUP" ]; then
  mv "$AUTH_BACKUP" "$AUTH_FILE"
  echo "  OK Đã khôi phục auth.json"
elif [ -f "$AUTH_FILE" ]; then
  rm -f "$AUTH_FILE"
  echo "  OK Đã xoá auth.json"
fi

echo ""
echo "  Gỡ cấu hình hoàn tất!"
echo ""
`;
}

function uninstallVsCodeExtWindows() {
  return [
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host "  Gỡ cấu hình Api4Cheap cho VS Code Extension" -ForegroundColor Yellow`,
    `Write-Host "================================" -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `$vsCodeSettingsDir = Join-Path $env:APPDATA "Code\\User"`,
    `$vsCodeSettingsFile = Join-Path $vsCodeSettingsDir "settings.json"`,
    `$backupFile = "$vsCodeSettingsFile.api4cheap-backup"`,
    ``,
    `if (Test-Path $backupFile) {`,
    `    Copy-Item $backupFile $vsCodeSettingsFile -Force`,
    `    Remove-Item $backupFile -Force`,
    `    Write-Host "  OK Đã khôi phục settings.json từ backup" -ForegroundColor Green`,
    `} elseif (Test-Path $vsCodeSettingsFile) {`,
    `    try {`,
    `        $settings = Get-Content $vsCodeSettingsFile -Raw | ConvertFrom-Json`,
    `        if ($settings.PSObject.Properties['claudeCode.environmentVariables']) {`,
    `            $settings.PSObject.Properties.Remove('claudeCode.environmentVariables')`,
    `            $utf8NoBom = New-Object System.Text.UTF8Encoding $false`,
    `            $settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $vsCodeSettingsFile -Encoding utf8`,
    `            Write-Host "  OK Đã xoá claudeCode.environmentVariables khỏi settings.json" -ForegroundColor Green`,
    `        } else {`,
    `            Write-Host "  Không tìm thấy claudeCode.environmentVariables trong settings.json" -ForegroundColor Yellow`,
    `        }`,
    `    } catch {`,
    `        Write-Host "  CẢNH BÁO Không thể đọc settings.json, vui lòng xoá thủ công" -ForegroundColor Yellow`,
    `    }`,
    `} else {`,
    `    Write-Host "  Không tìm thấy settings.json" -ForegroundColor Yellow`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "  Gỡ cấu hình hoàn tất!" -ForegroundColor Green`,
    `Write-Host ""`,
  ].join('\n');
}

function uninstallVsCodeExtUnix() {
  return `#!/bin/bash
echo "================================"
echo "  Gỡ cấu hình Api4Cheap cho VS Code Extension"
echo "================================"
echo ""

if [ "$(uname)" = "Darwin" ]; then
  VSCODE_DIR="$HOME/Library/Application Support/Code/User"
else
  VSCODE_DIR="$HOME/.config/Code/User"
fi
VSCODE_SETTINGS="$VSCODE_DIR/settings.json"
BACKUP_FILE="$VSCODE_SETTINGS.api4cheap-backup"

if [ -f "$BACKUP_FILE" ]; then
  mv "$BACKUP_FILE" "$VSCODE_SETTINGS"
  echo "  OK Đã khôi phục settings.json từ backup"
elif [ -f "$VSCODE_SETTINGS" ]; then
  if command -v node >/dev/null 2>&1; then
    node -e '
      const fs = require("fs");
      const file = process.argv[1];
      try {
        const settings = JSON.parse(fs.readFileSync(file, "utf8"));
        delete settings["claudeCode.environmentVariables"];
        fs.writeFileSync(file, JSON.stringify(settings, null, 2) + "\\n", "utf8");
        console.log("  OK Đã xoá claudeCode.environmentVariables khỏi settings.json");
      } catch (e) {
        console.log("  CẢNH BÁO Không thể đọc settings.json, vui lòng xoá thủ công");
      }
    ' "$VSCODE_SETTINGS"
  else
    echo "  CẢNH BÁO Cần Node.js để xoá tự động. Vui lòng xoá thủ công key claudeCode.environmentVariables"
  fi
else
  echo "  Không tìm thấy settings.json"
fi

echo ""
echo "  Gỡ cấu hình hoàn tất!"
echo ""
`;
}
