# Dashboard Gateway Api4Cheap

Dashboard Next.js và API gateway cho Api4Cheap. Phần cài đặt và tài liệu public tập trung vào hai client được hỗ trợ:

- Claude Code
- Codex CLI

Base URL public của Api4Cheap:

```text
https://lccaptcha.io.vn
```

## Endpoint Gateway

```text
POST /v1/messages    Định dạng Anthropic Messages API cho Claude Code
POST /v1/responses   Định dạng OpenAI Responses API cho Codex CLI
POST /v1/chat/completions   Giao diện chat và relay upstream
GET  /v1/models      Model mà gói hiện tại của người dùng được phép dùng
```

Xác thực:

```text
Claude Code: x-api-key: YOUR_API_KEY
Codex CLI:   Authorization: Bearer YOUR_API_KEY
```

## Cài Codex CLI

Cài Codex CLI chính thức:

```bash
npm install -g @openai/codex
# hoặc
brew install codex
```

Tạo `~/.codex/auth.json`:

```json
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```

Tạo `~/.codex/config.toml`:

```toml
model_provider = "api4cheap"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "https://lccaptcha.io.vn/v1"
wire_api = "responses"
```

Kiểm tra:

```bash
codex -V
codex
```

## Cài Claude Code

Cài Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

Tạo `~/.claude/settings.json`:

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

Khởi chạy:

```bash
claude
```

## Phát triển local

```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma generate
npm run db:seed
npm run dev
```

Mở `http://localhost:3000`.

Tài khoản admin mặc định từ seed:

```text
admin@local.dev / admin123
```

## Biến môi trường

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

`ROUTER_BASE_URL` và endpoint override ở từng model quyết định nơi gateway chuyển tiếp request. Hostname mặc định cho script cài đặt public là `https://lccaptcha.io.vn` và có thể ghi đè bằng `GATEWAY_BASE_URL`, `CODEX_BASE_URL`, `CLAUDE_CODE_BASE_URL`.

## Script

```bash
npm run dev
npm run build
npm start
npm run db:push
npm run db:generate
npm run db:seed
```

## Cấu trúc

```text
src/app/v1/responses       Gateway Responses tương thích Codex
src/app/v1/messages        Gateway Messages tương thích Claude Code
src/app/v1/chat/completions Giao diện chat và relay upstream
src/app/api/setup/[tool]   Bộ sinh script cài đặt nhanh
src/app/dashboard/docs     Tài liệu cài đặt và lệnh được tạo
prisma/schema.prisma       Schema SQLite
prisma/seed.ts             Admin, gói cước và model mẫu
```
