# Hướng Dẫn Cài Đặt Codex

Package chính thức: `@openai/codex`.

Base URL cho Api4Cheap:

```text
https://lccaptcha.io.vn
```

## 01. Cài Codex CLI

Chạy một trong hai lệnh sau:

```bash
npm install -g @openai/codex
# hoặc
brew install codex
```

Cả hai lệnh đều cài Codex CLI chính thức. Dùng lệnh phù hợp với môi trường của bạn.

## 02. Tạo thư mục `.codex`

Tạo thư mục nếu chưa tồn tại. Không xoá toàn bộ thư mục `.codex`; Codex có thể đang giữ database log khi chạy.

PowerShell:

```powershell
New-Item -ItemType Directory ~/.codex -Force
```

macOS / Linux:

```bash
mkdir -p ~/.codex
```

## 03. Lấy API key

Vào trang API key của Api4Cheap, tạo key mới và sao chép key đó.

## 04. Tạo `auth.json`

Tạo `C:\Users\<your-username>\.codex\auth.json` trên Windows, hoặc `~/.codex/auth.json` trên macOS / Linux:

```json
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```

Thay `YOUR_API_KEY` bằng key bạn đã sao chép.

## 05. Tạo `config.toml`

Tạo `C:\Users\<your-username>\.codex\config.toml` trên Windows, hoặc `~/.codex/config.toml` trên macOS / Linux:

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

Dán nội dung đúng như trên, ngoại trừ API key trong `auth.json`.

## 06. Khởi động lại và kiểm tra

Khởi động lại terminal, sau đó chạy:

```bash
codex -V
```

Nếu terminal in ra số phiên bản, Codex đã được cài đúng.

## 07. Bắt đầu dùng Codex

Đi tới thư mục dự án bất kỳ và khởi chạy Codex:

```bash
cd thu-muc-du-an-cua-ban
codex
```

Extension VS Code chính thức vẫn được hỗ trợ.
