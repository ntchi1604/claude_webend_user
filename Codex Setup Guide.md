# Codex Setup Guide

Official package: `@openai/codex`.

Base URL for Api4Cheap:

```text
https://lccaptcha.io.vn
```

## 01. Install Codex CLI

Run either command:

```bash
npm install -g @openai/codex
# or
brew install codex
```

Both commands install the official Codex CLI. Use whichever matches your setup.

## 02. Create the `.codex` Directory

Delete the existing directory if present, then recreate it.

PowerShell:

```powershell
Remove-Item -Recurse -Force ~/.codex -ErrorAction SilentlyContinue
New-Item -ItemType Directory ~/.codex
```

macOS / Linux:

```bash
rm -rf ~/.codex
mkdir -p ~/.codex
```

## 03. Get an API Key

Go to the Api4Cheap API Keys page, create a new key, and copy it.

## 04. Create `auth.json`

Create `C:\Users\<your-username>\.codex\auth.json` on Windows, or `~/.codex/auth.json` on macOS / Linux:

```json
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```

Replace `YOUR_API_KEY` with the key you copied.

## 05. Create `config.toml`

Create `C:\Users\<your-username>\.codex\config.toml` on Windows, or `~/.codex/config.toml` on macOS / Linux:

```toml
model_provider = "api4cheap"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "https://lccaptcha.io.vn"
wire_api = "responses"
```

Paste the content exactly as shown, except for your API key in `auth.json`.

## 06. Restart and Verify

Restart your terminal, then run:

```bash
codex -V
```

If a version number is printed, Codex is installed correctly.

## 07. Start Using Codex

Navigate to any project folder and launch Codex:

```bash
cd your-project-folder
codex
```

The official VS Code extension is supported.
