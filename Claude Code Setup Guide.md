# Claude Code Setup Guide

Base URL for Api4Cheap:

```text
https://lccaptcha.io.vn
```

## 01. Install Git Bash on Windows

On Windows, Git Bash is recommended because it handles paths and quoting more reliably than CMD or PowerShell.

Download Git for Windows and install it with the default options. If you already have Git Bash, skip this step.

## 02. Install Node.js

Claude Code requires Node.js 18 or newer.

```bash
node --version
```

If the printed version is lower than `18.0.0`, install the Node.js LTS version and reopen your terminal.

## 03. Create an API Key

Open the Api4Cheap API Keys page, create a key, and copy the secret.

Treat your key like a password. Anyone with it can spend your credits.

## 04. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Close and reopen your terminal after installation so the `claude` command is available.

## 05. Create `settings.json`

On Windows the config lives at:

```text
C:\Users\<you>\.claude\settings.json
```

On macOS / Linux:

```text
~/.claude/settings.json
```

If the `.claude` folder does not exist yet, run `claude` once to let it create the directory, then create `settings.json` with this content:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "https://lccaptcha.io.vn",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "apiKeyHelper": "echo 'YOUR_API_KEY'"
}
```

Replace both occurrences of `YOUR_API_KEY` with your API key.

## 06. Launch Claude Code

Restart your terminal, then run:

```bash
claude
```

You should see the welcome banner and prompt.

## FAQ

Update to latest:

```bash
npm install -g @anthropic-ai/claude-code
```

Uninstall:

```bash
npm uninstall -g @anthropic-ai/claude-code
```

If installation fails with a network error, try:

```bash
npm install -g @anthropic-ai/claude-code --registry https://registry.npmmirror.com
```
