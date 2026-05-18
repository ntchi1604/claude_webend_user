import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/setup/:tool?key=...&os=windows|mac&...model params
 * Returns a PowerShell or Bash script to configure the tool.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || 'sk-cw-xxxx';
  const os = url.searchParams.get('os') || 'windows';
  const baseUrl = process.env.APP_URL || 'https://lccaptcha.io.vn';
  const keyShort = key.slice(0, 8) + '...';

  let script = '';

  switch (tool) {
    case 'claude-code': {
      const haiku = url.searchParams.get('haiku') || '';
      const sonnet = url.searchParams.get('sonnet') || '';
      const opus = url.searchParams.get('opus') || '';
      if (os === 'windows') {
        script = generateClaudeCodeWindows({ baseUrl, key, keyShort, haiku, sonnet, opus });
      } else {
        script = generateClaudeCodeUnix({ baseUrl, key, keyShort, haiku, sonnet, opus });
      }
      break;
    }
    case 'cursor': {
      const model = url.searchParams.get('model') || '';
      script = generateCursorScript({ baseUrl, key, keyShort, model, os });
      break;
    }
    case 'cline': {
      const model = url.searchParams.get('model') || '';
      script = generateClineScript({ baseUrl, key, keyShort, model, os });
      break;
    }
    case 'openclaw': {
      const small = url.searchParams.get('small') || '';
      const medium = url.searchParams.get('medium') || '';
      const high = url.searchParams.get('high') || '';
      if (os === 'windows') {
        script = generateOpenClawWindows({ baseUrl, key, keyShort, small, medium, high });
      } else {
        script = generateOpenClawUnix({ baseUrl, key, keyShort, small, medium, high });
      }
      break;
    }
    case 'codex-cli': {
      const small = url.searchParams.get('small') || '';
      const medium = url.searchParams.get('medium') || '';
      const large = url.searchParams.get('large') || '';
      if (os === 'windows') {
        script = generateCodexCliWindows({ baseUrl, key, keyShort, small, medium, large });
      } else {
        script = generateCodexCliUnix({ baseUrl, key, keyShort, small, medium, large });
      }
      break;
    }
    case 'hermes-agent': {
      const model = url.searchParams.get('model') || '';
      if (os === 'windows') {
        script = generateHermesWindows({ baseUrl, key, keyShort, model });
      } else {
        script = generateHermesUnix({ baseUrl, key, keyShort, model });
      }
      break;
    }
    default:
      return NextResponse.json({ error: 'Unknown tool' }, { status: 404 });
  }

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// ─── Claude Code (Windows) ───
function generateClaudeCodeWindows(p: { baseUrl: string; key: string; keyShort: string; haiku: string; sonnet: string; opus: string }) {
  const models = [
    p.haiku && `Write-Host "Haiku:    ${p.haiku}"`,
    p.sonnet && `Write-Host "Sonnet:   ${p.sonnet}"`,
    p.opus && `Write-Host "Opus:     ${p.opus}"`,
  ].filter(Boolean).join('\n');

  const envModels = [
    p.haiku && `    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${p.haiku}",`,
    p.sonnet && `    "ANTHROPIC_DEFAULT_SONNET_MODEL": "${p.sonnet}",`,
    p.opus && `    "ANTHROPIC_DEFAULT_OPUS_MODEL": "${p.opus}"`,
  ].filter(Boolean).join('\n');

  return `Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Api4Cheap Claude Code Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: ${p.baseUrl}"
Write-Host "API Key:  ${p.keyShort}"
${models}
Write-Host ""

Write-Host "Configuring environment variables..."

# Remove old Anthropic login
$credFile = Join-Path (Join-Path $env:USERPROFILE ".claude") ".credentials.json"
if (Test-Path $credFile) {
    Remove-Item $credFile -Force
    Write-Host "  OK Deleted .credentials.json (old login)" -ForegroundColor Yellow
}
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
$env:ANTHROPIC_AUTH_TOKEN = $null
Write-Host "  OK Cleared ANTHROPIC_AUTH_TOKEN" -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "${p.baseUrl}", "User")
$env:ANTHROPIC_BASE_URL = "${p.baseUrl}"
Write-Host "  OK Set ANTHROPIC_BASE_URL" -ForegroundColor Green
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "${p.key}", "User")
$env:ANTHROPIC_API_KEY = "${p.key}"
Write-Host "  OK Set ANTHROPIC_API_KEY" -ForegroundColor Green
Write-Host ""

# Configure settings.json
Write-Host "Configuring Claude Code settings..."
$claudeDir = Join-Path $env:USERPROFILE ".claude"
$settingsFile = Join-Path $claudeDir "settings.json"
if (-not (Test-Path $claudeDir)) { New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null }

if (Test-Path $settingsFile) {
    $bk = Join-Path $claudeDir "settings.json.api4cheap-backup"
    Copy-Item $settingsFile $bk -Force
    Write-Host "  Backed up: $settingsFile" -ForegroundColor Yellow
}

function ConvertTo-Ht($obj) {
    if ($obj -is [System.Management.Automation.PSCustomObject]) {
        $ht = [ordered]@{}
        foreach ($p in $obj.PSObject.Properties) { $ht[$p.Name] = ConvertTo-Ht $p.Value }
        return $ht
    }
    return $obj
}
$existing = [ordered]@{}
if (Test-Path $settingsFile) {
    try {
        $raw = Get-Content $settingsFile -Raw -Encoding UTF8
        $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
        $existing = ConvertTo-Ht $parsed
    } catch {
        $existing = [ordered]@{}
    }
}

$newEnvJson = @'
{
    "ANTHROPIC_BASE_URL": "${p.baseUrl}",
    "ANTHROPIC_API_KEY": "${p.key}",
${envModels}
}
'@
$newEnv = ConvertTo-Ht ($newEnvJson | ConvertFrom-Json)

if ($existing.Contains("env") -and $existing["env"] -is [System.Collections.Specialized.OrderedDictionary]) {
    foreach ($k in $newEnv.Keys) { $existing["env"][$k] = $newEnv[$k] }
} else {
    $existing["env"] = $newEnv
}

if ($existing["env"] -is [System.Collections.Specialized.OrderedDictionary]) {
    if ($existing["env"].Contains("ANTHROPIC_AUTH_TOKEN")) { $existing["env"].Remove("ANTHROPIC_AUTH_TOKEN") }
}

$existing["disableLoginPrompt"] = $true

$merged = $existing | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($settingsFile, $merged, [System.Text.Encoding]::UTF8)
Write-Host "  OK Updated $settingsFile" -ForegroundColor Green
Write-Host ""

# Bypass onboarding
$cj = Join-Path $env:USERPROFILE ".claude.json"
if (-not (Test-Path $cj)) {
    '{"hasCompletedOnboarding":true}' | Set-Content $cj -Encoding UTF8
    Write-Host "  OK Bypass onboarding" -ForegroundColor Green
}

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

// ─── Claude Code (macOS/Linux) ───
function generateClaudeCodeUnix(p: { baseUrl: string; key: string; keyShort: string; haiku: string; sonnet: string; opus: string }) {
  const envLines = [
    `export ANTHROPIC_BASE_URL="${p.baseUrl}"`,
    `export ANTHROPIC_API_KEY="${p.key}"`,
    p.haiku && `export ANTHROPIC_DEFAULT_HAIKU_MODEL="${p.haiku}"`,
    p.sonnet && `export ANTHROPIC_DEFAULT_SONNET_MODEL="${p.sonnet}"`,
    p.opus && `export ANTHROPIC_DEFAULT_OPUS_MODEL="${p.opus}"`,
  ].filter(Boolean).join('\n');

  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap Claude Code Setup"
echo "================================"
echo ""
echo "Endpoint: ${p.baseUrl}"
echo "API Key:  ${p.keyShort}"
echo ""

# Remove old credentials
rm -f ~/.claude/.credentials.json 2>/dev/null
unset ANTHROPIC_AUTH_TOKEN

# Set env vars in shell profile
PROFILE=""
if [ -f "$HOME/.zshrc" ]; then PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then PROFILE="$HOME/.profile"
fi

if [ -n "$PROFILE" ]; then
  # Remove old entries
  sed -i.bak '/ANTHROPIC_BASE_URL/d; /ANTHROPIC_API_KEY/d; /ANTHROPIC_AUTH_TOKEN/d; /ANTHROPIC_DEFAULT_.*_MODEL/d' "$PROFILE"
  # Add new
  cat >> "$PROFILE" << 'EOF'
# Api4Cheap Claude Code
${envLines}
EOF
  echo "  OK Updated $PROFILE"
fi

${envLines}

# Configure settings.json
CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR"
SETTINGS="$CLAUDE_DIR/settings.json"

if [ -f "$SETTINGS" ]; then
  cp "$SETTINGS" "$CLAUDE_DIR/settings.json.api4cheap-backup"
fi

cat > "$SETTINGS" << 'SETTINGSEOF'
{
  "env": {
    "ANTHROPIC_BASE_URL": "${p.baseUrl}",
    "ANTHROPIC_API_KEY": "${p.key}"${p.haiku ? `,\n    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "${p.haiku}"` : ''}${p.sonnet ? `,\n    "ANTHROPIC_DEFAULT_SONNET_MODEL": "${p.sonnet}"` : ''}${p.opus ? `,\n    "ANTHROPIC_DEFAULT_OPUS_MODEL": "${p.opus}"` : ''}
  },
  "disableLoginPrompt": true
}
SETTINGSEOF

echo "  OK Updated settings.json"

# Bypass onboarding
if [ ! -f "$HOME/.claude.json" ]; then
  echo '{"hasCompletedOnboarding":true}' > "$HOME/.claude.json"
  echo "  OK Bypass onboarding"
fi

echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Restart terminal (or: source $PROFILE)"
echo "  2. Run: claude"
echo ""
`;
}

// ─── Cursor ───
function generateCursorScript(p: { baseUrl: string; key: string; keyShort: string; model: string; os: string }) {
  return `# Cursor Configuration
# Provider: OpenAI Compatible
# Base URL: ${p.baseUrl}/v1
# API Key:  ${p.key}
# Model:    ${p.model || 'claude-sonnet-4-5'}

# Paste these into Cursor Settings > Models > OpenAI Compatible:
#   Base URL: ${p.baseUrl}/v1
#   API Key:  ${p.key}
#   Model ID: ${p.model || 'claude-sonnet-4-5'}
`;
}

// ─── Cline ───
function generateClineScript(p: { baseUrl: string; key: string; keyShort: string; model: string; os: string }) {
  return `# Cline / Continue / Roo Code Configuration
# Provider: OpenAI Compatible
# Base URL: ${p.baseUrl}/v1
# API Key:  ${p.key}
# Model:    ${p.model || 'claude-sonnet-4-5'}
`;
}

// ─── OpenClaw (Windows) ───
function generateOpenClawWindows(p: { baseUrl: string; key: string; keyShort: string; small: string; medium: string; high: string }) {
  const models = [
    p.small && `Write-Host "Small:    ${p.small}"`,
    p.medium && `Write-Host "Medium:   ${p.medium}"`,
    p.high && `Write-Host "High:     ${p.high}"`,
  ].filter(Boolean).join('\n');

  return `Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Api4Cheap OpenClaw Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: ${p.baseUrl}"
Write-Host "API Key:  ${p.keyShort}"
${models}
Write-Host ""

Write-Host "Configuring OpenClaw..."

$configDir = Join-Path $env:USERPROFILE ".openclaw"
if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force | Out-Null }
$configFile = Join-Path $configDir "config.json"

if (Test-Path $configFile) {
    $bk = Join-Path $configDir "config.json.api4cheap-backup"
    Copy-Item $configFile $bk -Force
    Write-Host "  Backed up: $configFile" -ForegroundColor Yellow
}

$config = @"
{
  "apiBase": "${p.baseUrl}/v1",
  "apiKey": "${p.key}"${p.small ? `,\n  "smallModel": "${p.small}"` : ''}${p.medium ? `,\n  "mediumModel": "${p.medium}"` : ''}${p.high ? `,\n  "highModel": "${p.high}"` : ''}
}
"@
[System.IO.File]::WriteAllText($configFile, $config, [System.Text.Encoding]::UTF8)
Write-Host "  OK Updated $configFile" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart PowerShell"
Write-Host "  2. Run: openclaw"
Write-Host ""
`;
}

// ─── OpenClaw (macOS/Linux) ───
function generateOpenClawUnix(p: { baseUrl: string; key: string; keyShort: string; small: string; medium: string; high: string }) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap OpenClaw Setup"
echo "================================"
echo ""
echo "Endpoint: ${p.baseUrl}"
echo "API Key:  ${p.keyShort}"
echo ""

CONFIG_DIR="$HOME/.openclaw"
mkdir -p "$CONFIG_DIR"
CONFIG_FILE="$CONFIG_DIR/config.json"

if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_DIR/config.json.api4cheap-backup"
  echo "  Backed up: $CONFIG_FILE"
fi

cat > "$CONFIG_FILE" << 'EOF'
{
  "apiBase": "${p.baseUrl}/v1",
  "apiKey": "${p.key}"${p.small ? `,\n  "smallModel": "${p.small}"` : ''}${p.medium ? `,\n  "mediumModel": "${p.medium}"` : ''}${p.high ? `,\n  "highModel": "${p.high}"` : ''}
}
EOF

echo "  OK Updated $CONFIG_FILE"
echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Restart terminal"
echo "  2. Run: openclaw"
echo ""
`;
}

// ─── Codex CLI (Windows) ───
function generateCodexCliWindows(p: { baseUrl: string; key: string; keyShort: string; small: string; medium: string; large: string }) {
  const models = [
    p.small && `Write-Host "Small:    ${p.small}"`,
    p.medium && `Write-Host "Medium:   ${p.medium}"`,
    p.large && `Write-Host "Large:    ${p.large}"`,
  ].filter(Boolean).join('\n');

  return `Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Api4Cheap Codex CLI Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: ${p.baseUrl}"
Write-Host "API Key:  ${p.keyShort}"
${models}
Write-Host ""

Write-Host "Configuring Codex CLI..."

$configDir = Join-Path $env:USERPROFILE ".codex"
if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force | Out-Null }
$configFile = Join-Path $configDir "config.json"

if (Test-Path $configFile) {
    $bk = Join-Path $configDir "config.json.api4cheap-backup"
    Copy-Item $configFile $bk -Force
    Write-Host "  Backed up: $configFile" -ForegroundColor Yellow
}

$config = @"
{
  "apiBase": "${p.baseUrl}/v1",
  "apiKey": "${p.key}"${p.small ? `,\n  "smallModel": "${p.small}"` : ''}${p.medium ? `,\n  "mediumModel": "${p.medium}"` : ''}${p.large ? `,\n  "largeModel": "${p.large}"` : ''}
}
"@
[System.IO.File]::WriteAllText($configFile, $config, [System.Text.Encoding]::UTF8)
Write-Host "  OK Updated $configFile" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart PowerShell"
Write-Host "  2. Run: codex"
Write-Host ""
`;
}

// ─── Codex CLI (macOS/Linux) ───
function generateCodexCliUnix(p: { baseUrl: string; key: string; keyShort: string; small: string; medium: string; large: string }) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap Codex CLI Setup"
echo "================================"
echo ""
echo "Endpoint: ${p.baseUrl}"
echo "API Key:  ${p.keyShort}"
echo ""

CONFIG_DIR="$HOME/.codex"
mkdir -p "$CONFIG_DIR"
CONFIG_FILE="$CONFIG_DIR/config.json"

if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_DIR/config.json.api4cheap-backup"
  echo "  Backed up: $CONFIG_FILE"
fi

cat > "$CONFIG_FILE" << 'EOF'
{
  "apiBase": "${p.baseUrl}/v1",
  "apiKey": "${p.key}"${p.small ? `,\n  "smallModel": "${p.small}"` : ''}${p.medium ? `,\n  "mediumModel": "${p.medium}"` : ''}${p.large ? `,\n  "largeModel": "${p.large}"` : ''}
}
EOF

echo "  OK Updated $CONFIG_FILE"
echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Restart terminal"
echo "  2. Run: codex"
echo ""
`;
}

// ─── Hermes (Windows) ───
function generateHermesWindows(p: { baseUrl: string; key: string; keyShort: string; model: string }) {
  return `Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Api4Cheap Hermes Agent Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: ${p.baseUrl}"
Write-Host "API Key:  ${p.keyShort}"
Write-Host "Model:    ${p.model}"
Write-Host ""

Write-Host "Configuring Hermes Agent..."

$configDir = Join-Path $env:USERPROFILE ".hermes"
if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force | Out-Null }
$configFile = Join-Path $configDir "config.json"

if (Test-Path $configFile) {
    $bk = Join-Path $configDir "config.json.api4cheap-backup"
    Copy-Item $configFile $bk -Force
    Write-Host "  Backed up: $configFile" -ForegroundColor Yellow
}

$config = @"
{
  "apiBase": "${p.baseUrl}/v1",
  "apiKey": "${p.key}"${p.model ? `,\n  "model": "${p.model}"` : ''}
}
"@
[System.IO.File]::WriteAllText($configFile, $config, [System.Text.Encoding]::UTF8)
Write-Host "  OK Updated $configFile" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart PowerShell"
Write-Host "  2. Run: hermes"
Write-Host ""
`;
}

// ─── Hermes (macOS/Linux) ───
function generateHermesUnix(p: { baseUrl: string; key: string; keyShort: string; model: string }) {
  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap Hermes Agent Setup"
echo "================================"
echo ""
echo "Endpoint: ${p.baseUrl}"
echo "API Key:  ${p.keyShort}"
echo ""

CONFIG_DIR="$HOME/.hermes"
mkdir -p "$CONFIG_DIR"
CONFIG_FILE="$CONFIG_DIR/config.json"

if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_DIR/config.json.api4cheap-backup"
  echo "  Backed up: $CONFIG_FILE"
fi

cat > "$CONFIG_FILE" << 'EOF'
{
  "apiBase": "${p.baseUrl}/v1",
  "apiKey": "${p.key}"${p.model ? `,\n  "model": "${p.model}"` : ''}
}
EOF

echo "  OK Updated $CONFIG_FILE"
echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Restart terminal"
echo "  2. Run: hermes"
echo ""
`;
}
