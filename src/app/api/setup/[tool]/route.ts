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
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($settingsFile, $merged, $utf8NoBom)
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
  const apiBase = `${p.baseUrl}/v1`;
  const envMergeLines = [
    `$envLines["OPENAI_BASE_URL"] = '"' + "${apiBase}" + '"'`,
    `$envLines["OPENAI_API_KEY"] = '"' + "${p.key}" + '"'`,
    p.small ? `$envLines["SMALL_MODEL"] = '"' + "${p.small}" + '"'` : '',
    p.medium ? `$envLines["MEDIUM_MODEL"] = '"' + "${p.medium}" + '"'` : '',
    p.high ? `$envLines["HIGH_MODEL"] = '"' + "${p.high}" + '"'` : '',
  ].filter(Boolean).join('\n');

  return [
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host "  Api4Cheap OpenClaw Setup" -ForegroundColor Cyan`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host ""`,
    `Write-Host "Endpoint: ${apiBase}"`,
    `Write-Host "API Key:  ${p.keyShort}"`,
    `Write-Host ""`,
    ``,
    `# Set env vars (persistent)`,
    `[System.Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", "${apiBase}", "User")`,
    `$env:OPENAI_BASE_URL = "${apiBase}"`,
    `Write-Host "  OK Set OPENAI_BASE_URL" -ForegroundColor Green`,
    `[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "${p.key}", "User")`,
    `$env:OPENAI_API_KEY = "${p.key}"`,
    `Write-Host "  OK Set OPENAI_API_KEY" -ForegroundColor Green`,
    `Write-Host ""`,
    ``,
    `# Configure ~/.openclaw/.env (smart merge)`,
    `Write-Host "Configuring OpenClaw..."`,
    `$ocDir = Join-Path $env:USERPROFILE ".openclaw"`,
    `$envFile = Join-Path $ocDir ".env"`,
    `if (-not (Test-Path $ocDir)) { New-Item -ItemType Directory -Path $ocDir -Force | Out-Null }`,
    ``,
    `# Read existing .env and merge`,
    `$envLines = @{}`,
    `if (Test-Path $envFile) {`,
    `    Get-Content $envFile | ForEach-Object {`,
    `        if ($_ -match "^([^#=]+)=(.*)$") { $envLines[$matches[1].Trim()] = $matches[2].Trim() }`,
    `    }`,
    `    Write-Host "  Read existing .env (smart merge)" -ForegroundColor Cyan`,
    `}`,
    envMergeLines,
    `$envContent = ($envLines.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "\`n"`,
    `[System.IO.File]::WriteAllText($envFile, $envContent, [System.Text.Encoding]::UTF8)`,
    `Write-Host "  OK Updated $envFile" -ForegroundColor Green`,
    `Write-Host ""`,
    ``,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host "  Configuration Complete!" -ForegroundColor Green`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host ""`,
    `Write-Host "Next steps:" -ForegroundColor Cyan`,
    `Write-Host "  1. Restart PowerShell"`,
    `Write-Host "  2. Run: openclaw"`,
    `Write-Host ""`,
  ].join('\n');
}

// ─── OpenClaw (macOS/Linux) ───
function generateOpenClawUnix(p: { baseUrl: string; key: string; keyShort: string; small: string; medium: string; high: string }) {
  const apiBase = `${p.baseUrl}/v1`;
  const envFileLines = [
    `OPENAI_BASE_URL="${apiBase}"`,
    `OPENAI_API_KEY="${p.key}"`,
    p.small ? `SMALL_MODEL="${p.small}"` : '',
    p.medium ? `MEDIUM_MODEL="${p.medium}"` : '',
    p.high ? `HIGH_MODEL="${p.high}"` : '',
  ].filter(Boolean).join('\\n');

  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap OpenClaw Setup"
echo "================================"
echo ""
echo "Endpoint: ${apiBase}"
echo "API Key:  ${p.keyShort}"
echo ""

# Set env vars in shell profile
PROFILE=""
if [ -f "$HOME/.zshrc" ]; then PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then PROFILE="$HOME/.profile"
fi

if [ -n "$PROFILE" ]; then
  sed -i.bak '/OPENAI_BASE_URL/d; /OPENAI_API_KEY/d' "$PROFILE"
  cat >> "$PROFILE" << 'EOF'
# Api4Cheap OpenClaw
export OPENAI_BASE_URL="${apiBase}"
export OPENAI_API_KEY="${p.key}"
EOF
  echo "  OK Updated $PROFILE"
fi

export OPENAI_BASE_URL="${apiBase}"
export OPENAI_API_KEY="${p.key}"

# Configure ~/.openclaw/.env (smart merge)
echo "Configuring OpenClaw..."
OC_DIR="$HOME/.openclaw"
ENV_FILE="$OC_DIR/.env"
mkdir -p "$OC_DIR"

if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$OC_DIR/.env.api4cheap-backup"
  echo "  Backed up: $ENV_FILE"
fi

printf '${envFileLines}\\n' > "$ENV_FILE"
echo "  OK Updated $ENV_FILE"
echo ""

echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Restart terminal (or: source $PROFILE)"
echo "  2. Run: openclaw"
echo ""
`;
}

// ─── Codex CLI (Windows) ───
function generateCodexCliWindows(p: { baseUrl: string; key: string; keyShort: string; small: string; medium: string; large: string }) {
  const apiBase = `${p.baseUrl}/v1`;
  const defaultModel = p.medium || p.small || p.large || 'gpt-4o';

  const modelEntries = [p.small, p.medium, p.large].filter(Boolean).map((slug, i) => {
    const labels = ['Fast', 'Default', 'Powerful'];
    const label = labels[i] || 'Model';
    return JSON.stringify({
      slug,
      display_name: slug,
      description: `${slug} via Api4Cheap (${label})`,
      base_instructions: "",
      default_reasoning_level: "medium",
      supported_reasoning_levels: [
        { effort: "low", description: "Minimal reasoning" },
        { effort: "medium", description: "Balanced reasoning" },
        { effort: "high", description: "Deep reasoning" },
        { effort: "xhigh", description: "Maximum reasoning" },
      ],
      shell_type: "shell_command",
      visibility: "list",
      supported_in_api: true,
      priority: i + 1,
      supports_reasoning_summaries: false,
      default_reasoning_summary: "auto",
      support_verbosity: true,
      web_search_tool_type: "text",
      truncation_policy: { mode: "tokens", limit: 400000 },
      supports_parallel_tool_calls: true,
      context_window: 400000,
      effective_context_window_percent: 95,
      input_modalities: ["text", "image"],
      supports_search_tool: false,
      experimental_supported_tools: [],
    }, null, 4);
  });

  const modelsJson = JSON.stringify({ models: JSON.parse(`[${modelEntries.join(',')}]`) }, null, 2);
  const authJson = JSON.stringify({ auth_mode: "apikey", OPENAI_API_KEY: p.key }, null, 2);

  return [
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host "  Api4Cheap Codex CLI Setup" -ForegroundColor Cyan`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host ""`,
    `Write-Host "Endpoint:          ${apiBase}"`,
    `Write-Host "API Key:           ${p.keyShort}"`,
    p.small ? `Write-Host "Small (Fast):      ${p.small}"` : '',
    p.medium ? `Write-Host "Medium (Default):  ${p.medium}"` : '',
    p.large ? `Write-Host "Large (Powerful):  ${p.large}"` : '',
    `Write-Host ""`,
    ``,
    `# Check prerequisites`,
    `Write-Host "Checking prerequisites..."`,
    `$nodeV = node --version 2>$null`,
    `if ($nodeV) { Write-Host "  OK Node.js $nodeV" -ForegroundColor Green } else { Write-Host "  WARN Node.js not found" -ForegroundColor Yellow }`,
    `$npmV = npm --version 2>$null`,
    `if ($npmV) { Write-Host "  OK npm $npmV" -ForegroundColor Green } else { Write-Host "  WARN npm not found" -ForegroundColor Yellow }`,
    ``,
    `# Check if codex is installed`,
    `$codexPath = Get-Command codex -ErrorAction SilentlyContinue`,
    `if ($codexPath) { Write-Host "" ; Write-Host "Codex CLI already installed" -ForegroundColor Green } else {`,
    `    Write-Host "" ; Write-Host "Installing Codex CLI..." -ForegroundColor Yellow`,
    `    npm install -g @openai/codex-cli@latest 2>$null`,
    `    if ($?) { Write-Host "  OK Installed" -ForegroundColor Green } else { Write-Host "  FAIL Install failed" -ForegroundColor Red }`,
    `}`,
    ``,
    `# Configure ~/.codex/`,
    `Write-Host ""`,
    `Write-Host "Configuring Codex CLI..."`,
    `$codexDir = Join-Path $env:USERPROFILE ".codex"`,
    `$configFile = Join-Path $codexDir "config.toml"`,
    `$modelsFile = Join-Path $codexDir "models.json"`,
    `$authFile = Join-Path $codexDir "auth.json"`,
    `if (-not (Test-Path $codexDir)) { New-Item -ItemType Directory -Path $codexDir -Force | Out-Null }`,
    ``,
    `# Backup existing config.toml`,
    `if (Test-Path $configFile) {`,
    `    $bk = Join-Path $codexDir "config.toml.api4cheap-backup"`,
    `    Copy-Item $configFile $bk -Force`,
    `    Write-Host "  Backed up: $configFile" -ForegroundColor Yellow`,
    `}`,
    ``,
    `# Write config.toml`,
    `$utf8NoBom = New-Object System.Text.UTF8Encoding $false`,
    `$tomlContent = "model = \`"${defaultModel}\`"\`nmodel_provider = \`"api4cheap\`"\`nmodel_catalog_json = \`"~/.codex/models.json\`"\`n\`n[model_providers.api4cheap]\`nname = \`"Api4Cheap\`"\`nbase_url = \`"${apiBase}\`"\`nexperimental_bearer_token = \`"${p.key}\`"\`nwire_api = \`"responses\`"\`n\`n[features]\`napps = false"`,
    `[System.IO.File]::WriteAllText($configFile, $tomlContent, $utf8NoBom)`,
    `Write-Host "  OK Written config.toml" -ForegroundColor Green`,
    ``,
    `# Write models.json`,
    `$modelsContent = @'`,
    modelsJson,
    `'@`,
    `[System.IO.File]::WriteAllText($modelsFile, $modelsContent, $utf8NoBom)`,
    `Write-Host "  OK Written models.json" -ForegroundColor Green`,
    ``,
    `# Write auth.json`,
    `if (Test-Path $authFile) {`,
    `    Write-Host "  OK Kept existing auth.json" -ForegroundColor Green`,
    `} else {`,
    `    $authContent = @'`,
    authJson,
    `'@`,
    `    [System.IO.File]::WriteAllText($authFile, $authContent, $utf8NoBom)`,
    `    Write-Host "  OK Written auth.json" -ForegroundColor Green`,
    `}`,
    ``,
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host "  Configuration Complete!" -ForegroundColor Green`,
    `Write-Host "================================" -ForegroundColor Green`,
    `Write-Host ""`,
    `Write-Host "Codex CLI is now configured to use Api4Cheap:" -ForegroundColor Cyan`,
    `Write-Host "  Endpoint:          ${apiBase}"`,
    `Write-Host "  API Key:           ${p.keyShort}"`,
    p.small ? `Write-Host "  Small (Fast):      ${p.small}"` : '',
    p.medium ? `Write-Host "  Medium (Default):  ${p.medium}"` : '',
    p.large ? `Write-Host "  Large (Powerful):  ${p.large}"` : '',
    `Write-Host ""`,
    `Write-Host "Next steps:" -ForegroundColor Cyan`,
    `Write-Host "  Run: codex"`,
    `Write-Host ""`,
  ].filter(Boolean).join('\n');
}

// ─── Codex CLI (macOS/Linux) ───
function generateCodexCliUnix(p: { baseUrl: string; key: string; keyShort: string; small: string; medium: string; large: string }) {
  const apiBase = `${p.baseUrl}/v1`;
  const defaultModel = p.medium || p.small || p.large || 'gpt-4o';

  const modelJsonEntries = [p.small, p.medium, p.large].filter(Boolean).map((slug, i) => {
    const labels = ['Fast', 'Default', 'Powerful'];
    const label = labels[i] || 'Model';
    return `    {"slug":"${slug}","display_name":"${slug}","description":"${slug} via Api4Cheap (${label})","base_instructions":"","default_reasoning_level":"medium","supported_reasoning_levels":[{"effort":"low","description":"Minimal reasoning"},{"effort":"medium","description":"Balanced reasoning"},{"effort":"high","description":"Deep reasoning"},{"effort":"xhigh","description":"Maximum reasoning"}],"shell_type":"shell_command","visibility":"list","supported_in_api":true,"priority":${i + 1},"supports_reasoning_summaries":false,"default_reasoning_summary":"auto","support_verbosity":true,"web_search_tool_type":"text","truncation_policy":{"mode":"tokens","limit":400000},"supports_parallel_tool_calls":true,"context_window":400000,"effective_context_window_percent":95,"input_modalities":["text","image"],"supports_search_tool":false,"experimental_supported_tools":[]}`;
  });

  return `#!/bin/bash
echo ""
echo "================================"
echo "  Api4Cheap Codex CLI Setup"
echo "================================"
echo ""
echo "Endpoint:          ${apiBase}"
echo "API Key:           ${p.keyShort}"
${p.small ? `echo "Small (Fast):      ${p.small}"` : ''}
${p.medium ? `echo "Medium (Default):  ${p.medium}"` : ''}
${p.large ? `echo "Large (Powerful):  ${p.large}"` : ''}
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if command -v node &>/dev/null; then echo "  OK Node.js $(node --version)"; else echo "  WARN Node.js not found"; fi
if command -v npm &>/dev/null; then echo "  OK npm $(npm --version)"; else echo "  WARN npm not found"; fi

# Check if codex is installed
if command -v codex &>/dev/null; then
    echo ""; echo "Codex CLI already installed"
else
    echo ""; echo "Installing Codex CLI..."
    npm install -g @openai/codex-cli@latest 2>/dev/null
    if [ $? -eq 0 ]; then echo "  OK Installed"; else echo "  FAIL Install failed"; fi
fi

# Configure ~/.codex/
echo ""
echo "Configuring Codex CLI..."
CODEX_DIR="$HOME/.codex"
mkdir -p "$CODEX_DIR"
CONFIG_FILE="$CODEX_DIR/config.toml"
MODELS_FILE="$CODEX_DIR/models.json"
AUTH_FILE="$CODEX_DIR/auth.json"

# Backup existing
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CODEX_DIR/config.toml.api4cheap-backup"
  echo "  Backed up: $CONFIG_FILE"
fi

# Write config.toml
cat > "$CONFIG_FILE" << 'TOMLEOF'
model = "${defaultModel}"
model_provider = "api4cheap"
model_catalog_json = "~/.codex/models.json"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "${apiBase}"
experimental_bearer_token = "${p.key}"
wire_api = "responses"

[features]
apps = false
TOMLEOF
echo "  OK Written config.toml"

# Write models.json
cat > "$MODELS_FILE" << 'MODELSEOF'
{"models":[${modelJsonEntries.join(',')}]}
MODELSEOF
echo "  OK Written models.json"

# Write auth.json
if [ -f "$AUTH_FILE" ]; then
  echo "  OK Kept existing auth.json"
else
  cat > "$AUTH_FILE" << 'AUTHEOF'
{"auth_mode":"apikey","OPENAI_API_KEY":"${p.key}"}
AUTHEOF
  echo "  OK Written auth.json"
fi

echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "  Run: codex"
echo ""
`;
}

// ─── Hermes (Windows) ───
function generateHermesWindows(p: { baseUrl: string; key: string; keyShort: string; model: string }) {
  const apiBase = `${p.baseUrl}/v1`;
  const model = p.model || 'gpt-4o';

  const bashScript = generateHermesUnixInner({ apiBase, key: p.key, keyShort: p.keyShort, model });
  const escapedBash = bashScript.replace(/"/g, '`"').replace(/\$/g, '`$').replace(/\n/g, '`n');

  return [
    `Write-Host ""`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host "  Api4Cheap Hermes Agent Setup" -ForegroundColor Cyan`,
    `Write-Host "================================" -ForegroundColor Cyan`,
    `Write-Host ""`,
    `Write-Host "Endpoint:  ${apiBase}"`,
    `Write-Host "API Key:   ${p.keyShort}"`,
    `Write-Host "Model:     ${model}"`,
    `Write-Host ""`,
    ``,
    `# Hermes Agent requires Linux — check for WSL2`,
    `Write-Host "Checking WSL2..." -ForegroundColor Yellow`,
    `$wslPath = Get-Command wsl.exe -ErrorAction SilentlyContinue`,
    `if (-not $wslPath) {`,
    `    Write-Host ""`,
    `    Write-Host "ERROR: WSL2 is required for Hermes Agent." -ForegroundColor Red`,
    `    Write-Host "Hermes Agent does not support native Windows." -ForegroundColor Red`,
    `    Write-Host ""`,
    `    Write-Host "Install WSL2:" -ForegroundColor Cyan`,
    `    Write-Host "  wsl --install"`,
    `    Write-Host "  (Restart your computer after installation)"`,
    `    Write-Host ""`,
    `    Write-Host "Then re-run this setup command." -ForegroundColor Yellow`,
    `    exit 1`,
    `}`,
    ``,
    `Write-Host "  OK WSL2 found" -ForegroundColor Green`,
    `Write-Host "Running setup inside WSL..." -ForegroundColor Yellow`,
    `Write-Host ""`,
    ``,
    `$bashCmd = "${escapedBash}"`,
    `wsl bash -c $bashCmd`,
    ``,
    `if ($LASTEXITCODE -eq 0) {`,
    `    Write-Host ""`,
    `    Write-Host "================================" -ForegroundColor Green`,
    `    Write-Host "  Setup Complete!" -ForegroundColor Green`,
    `    Write-Host "================================" -ForegroundColor Green`,
    `    Write-Host ""`,
    `    Write-Host "Next steps:" -ForegroundColor Cyan`,
    `    Write-Host "  Open WSL terminal and run: hermes"`,
    `    Write-Host ""`,
    `} else {`,
    `    Write-Host "Setup failed. Check errors above." -ForegroundColor Red`,
    `}`,
  ].join('\n');
}

function generateHermesUnixInner(p: { apiBase: string; key: string; keyShort: string; model: string }) {
  return `echo ""
echo "================================"
echo "  Api4Cheap Hermes Agent Setup"
echo "================================"
echo ""
echo "Endpoint:  ${p.apiBase}"
echo "API Key:   ${p.keyShort}"
echo "Model:     ${p.model}"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
    PY_V=$(python3 --version 2>/dev/null)
    echo "  OK $PY_V"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
    PY_V=$(python --version 2>/dev/null)
    echo "  OK $PY_V"
else
    echo "  FAIL Python not found. Hermes Agent requires Python 3.11+"
    echo "  Install: https://python.org or apt install python3"
    exit 1
fi

# Check if hermes is installed
if command -v hermes &>/dev/null; then
    echo "  OK Hermes Agent already installed"
else
    echo ""
    echo "Installing Hermes Agent..."
    if command -v pipx &>/dev/null; then
        pipx install hermes-agent 2>/dev/null
    elif command -v uv &>/dev/null; then
        uv tool install hermes-agent 2>/dev/null
    else
        $PYTHON_CMD -m pip install --user hermes-agent 2>/dev/null
    fi
    if command -v hermes &>/dev/null; then
        echo "  OK Hermes Agent installed"
    else
        echo "  WARN Could not auto-install. Try: pip install hermes-agent"
    fi
fi

# Configure ~/.hermes/
echo ""
echo "Configuring Hermes Agent..."
HERMES_DIR="$HOME/.hermes"
CONFIG_FILE="$HERMES_DIR/config.yaml"
mkdir -p "$HERMES_DIR"

# Backup existing config.yaml
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$HERMES_DIR/config.yaml.api4cheap-backup"
    echo "  Backed up: $CONFIG_FILE"
fi

# Write config using Python for YAML handling
$PYTHON_CMD << 'API4CHEAP_PYMERGE'
import os, sys
try:
    import yaml
except ImportError:
    cfg_path = os.path.expanduser("~/.hermes/config.yaml")
    content = """# Api4Cheap Platform Configuration
model:
  default: "${p.model}"
  provider: "custom"
  base_url: "${p.apiBase}"
  api_key: "${p.key}"
"""
    with open(cfg_path, "w") as f:
        f.write(content)
    print("  OK Written config.yaml (minimal, PyYAML not found)")
    sys.exit(0)

cfg_path = os.path.expanduser("~/.hermes/config.yaml")
cfg = {}
if os.path.exists(cfg_path):
    with open(cfg_path) as f:
        cfg = yaml.safe_load(f) or {}

if "model" not in cfg:
    cfg["model"] = {}
cfg["model"]["default"] = "${p.model}"
cfg["model"]["provider"] = "custom"
cfg["model"]["base_url"] = "${p.apiBase}"
cfg["model"]["api_key"] = "${p.key}"

with open(cfg_path, "w") as f:
    yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
print("  OK Written config.yaml (smart merge)")
API4CHEAP_PYMERGE

echo ""
echo "================================"
echo "  Configuration Complete!"
echo "================================"
echo ""
echo "Hermes Agent is now configured to use Api4Cheap:"
echo "  Endpoint:  ${p.apiBase}"
echo "  API Key:   ${p.keyShort}"
echo "  Model:     ${p.model}"
echo ""
echo "Next steps:"
echo "  Run: hermes"
echo ""`;
}

// ─── Hermes (macOS/Linux) ───
function generateHermesUnix(p: { baseUrl: string; key: string; keyShort: string; model: string }) {
  const apiBase = `${p.baseUrl}/v1`;
  const model = p.model || 'gpt-4o';
  return generateHermesUnixInner({ apiBase, key: p.key, keyShort: p.keyShort, model });
}
