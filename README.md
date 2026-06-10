# Dashboard Gateway Api4Cheap

Dashboard Next.js vÃ  API gateway cho Api4Cheap. Pháº§n cÃ i Ä‘áº·t vÃ  tÃ i liá»‡u public táº­p trung vÃ o hai client Ä‘Æ°á»£c há»— trá»£:

- Claude Code
- Codex CLI

Base URL public cá»§a Api4Cheap:

```text
https://your-domain
```

## Endpoint Gateway

```text
POST /v1/messages    Äá»‹nh dáº¡ng Anthropic Messages API cho Claude Code
POST /v1/responses   Äá»‹nh dáº¡ng OpenAI Responses API cho Codex CLI
POST /v1/chat/completions   Giao diá»‡n chat vÃ  relay upstream
GET  /v1/models      Model mÃ  gÃ³i hiá»‡n táº¡i cá»§a ngÆ°á»i dÃ¹ng Ä‘Æ°á»£c phÃ©p dÃ¹ng
```

XÃ¡c thá»±c:

```text
Claude Code: x-api-key: YOUR_API_KEY
Codex CLI:   Authorization: Bearer YOUR_API_KEY
```

## CÃ i Codex CLI

CÃ i Codex CLI chÃ­nh thá»©c:

```bash
npm install -g @openai/codex
# hoáº·c
brew install codex
```

Táº¡o `~/.codex/auth.json`:

```json
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```

Táº¡o `~/.codex/config.toml`:

```toml
model_provider = "api4cheap"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "https://your-domain/v1"
wire_api = "responses"
```

Kiá»ƒm tra:

```bash
codex -V
codex
```

## CÃ i Claude Code

CÃ i Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

Táº¡o `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "https://your-domain",
    "ANTHROPIC_DISABLE_INTERLEAVED_STREAMING": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  }
}
```

Khá»Ÿi cháº¡y:

```bash
claude
```

## PhÃ¡t triá»ƒn local

```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma generate
npm run db:seed
npm run dev
```

Má»Ÿ `http://localhost:3000`.

TÃ i khoáº£n admin máº·c Ä‘á»‹nh tá»« seed:

```text
admin@local.dev / admin123
```

## Biáº¿n mÃ´i trÆ°á»ng

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-to-a-long-random-string-min-32-chars"

ROUTER_BASE_URL="http://localhost:8000"
ROUTER_API_KEY=""

APP_URL="https://your-domain"
GATEWAY_BASE_URL="https://your-domain"
CODEX_BASE_URL="https://your-domain"
CLAUDE_CODE_BASE_URL="https://your-domain"
```

`ROUTER_BASE_URL` vÃ  endpoint override á»Ÿ tá»«ng model quyáº¿t Ä‘á»‹nh nÆ¡i gateway chuyá»ƒn tiáº¿p request. TrÃªn giao diá»‡n web vÃ  script cÃ i Ä‘áº·t nhanh, project tá»± nháº­n diá»‡n domain hiá»‡n táº¡i tá»« request host/proxy headers.

## Script

```bash
npm run dev
npm run build
npm start
npm run db:push
npm run db:generate
npm run db:seed
```

## Cáº¥u trÃºc

```text
src/app/v1/responses       Gateway Responses tÆ°Æ¡ng thÃ­ch Codex
src/app/v1/messages        Gateway Messages tÆ°Æ¡ng thÃ­ch Claude Code
src/app/v1/chat/completions Giao diá»‡n chat vÃ  relay upstream
src/app/api/setup/[tool]   Bá»™ sinh script cÃ i Ä‘áº·t nhanh
src/app/dashboard/docs     TÃ i liá»‡u cÃ i Ä‘áº·t vÃ  lá»‡nh Ä‘Æ°á»£c táº¡o
prisma/schema.prisma       Schema SQLite
prisma/seed.ts             Admin, gÃ³i cÆ°á»›c vÃ  model máº«u
```
