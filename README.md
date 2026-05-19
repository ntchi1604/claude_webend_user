# Api4Cheap Gateway Dashboard

Next.js dashboard and API gateway for Api4Cheap. Setup and public docs are focused on two supported clients:

- Claude Code
- Codex CLI

Public Api4Cheap base URL:

```text
https://lccaptcha.io.vn
```

## Gateway Endpoints

```text
POST /v1/messages    Anthropic Messages API shape for Claude Code
POST /v1/responses   OpenAI Responses API shape for Codex CLI
POST /v1/chat/completions   Chat UI and upstream relay
GET  /v1/models      Models allowed by the user's current plan
```

Auth:

```text
Claude Code: x-api-key: YOUR_API_KEY
Codex CLI:   Authorization: Bearer YOUR_API_KEY
```

## Codex CLI Setup

Install the official Codex CLI:

```bash
npm install -g @openai/codex
# or
brew install codex
```

Create `~/.codex/auth.json`:

```json
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```

Create `~/.codex/config.toml`:

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

Verify:

```bash
codex -V
codex
```

## Claude Code Setup

Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

Create `~/.claude/settings.json`:

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
  }
}
```

Launch:

```bash
claude
```

## Local Development

```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma generate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Default admin account from seed:

```text
admin@local.dev / admin123
```

## Environment

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-to-a-long-random-string-min-32-chars"

ROUTER_BASE_URL="http://localhost:8000"
ROUTER_API_KEY=""

APP_URL="https://lccaptcha.io.vn"
GATEWAY_BASE_URL="https://lccaptcha.io.vn"
CODEX_BASE_URL="https://lccaptcha.io.vn"
CLAUDE_CODE_BASE_URL="https://lccaptcha.io.vn"
```

`ROUTER_BASE_URL` and model-level endpoint overrides control where gateway requests are forwarded. The public setup-script hostname is `https://lccaptcha.io.vn` by default and can be overridden with `GATEWAY_BASE_URL`, `CODEX_BASE_URL`, and `CLAUDE_CODE_BASE_URL`.

## Scripts

```bash
npm run dev
npm run build
npm start
npm run db:push
npm run db:generate
npm run db:seed
```

## Structure

```text
src/app/v1/responses       Codex-compatible Responses gateway
src/app/v1/messages        Claude Code-compatible Messages gateway
src/app/v1/chat/completions Chat UI and upstream relay
src/app/api/setup/[tool]   Quick Setup script generator
src/app/dashboard/docs     Setup documentation and generated commands
prisma/schema.prisma       SQLite schema
prisma/seed.ts             Admin, plans, and sample models
```
