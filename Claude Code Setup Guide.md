# Hướng Dẫn Cài Đặt Claude Code

Base URL cho Api4Cheap:

```text
https://lccaptcha.io.vn
```

## 01. Cài Git Bash trên Windows

Trên Windows, nên dùng Git Bash vì công cụ này xử lý path và quoting ổn định hơn CMD hoặc PowerShell.

Tải Git for Windows và cài với tuỳ chọn mặc định. Nếu đã có Git Bash, bỏ qua bước này.

## 02. Cài Node.js

Claude Code yêu cầu Node.js 18 trở lên.

```bash
node --version
```

Nếu phiên bản in ra nhỏ hơn `18.0.0`, hãy cài Node.js LTS rồi mở lại terminal.

## 03. Tạo API key

Mở trang API key của Api4Cheap, tạo key mới và sao chép secret.

Hãy giữ key như mật khẩu. Bất kỳ ai có key đều có thể dùng credit của bạn.

## 04. Cài Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Đóng và mở lại terminal sau khi cài để lệnh `claude` khả dụng.

## 05. Tạo `settings.json`

Trên Windows, file cấu hình nằm tại:

```text
C:\Users\<you>\.claude\settings.json
```

Trên macOS / Linux:

```text
~/.claude/settings.json
```

Nếu thư mục `.claude` chưa tồn tại, chạy `claude` một lần để client tạo thư mục, sau đó tạo `settings.json` với nội dung:

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

Thay `YOUR_API_KEY` bằng API key của bạn.

## 06. Khởi chạy Claude Code

Khởi động lại terminal, sau đó chạy:

```bash
claude
```

Bạn sẽ thấy màn hình chào và prompt.

## FAQ

Cập nhật lên bản mới nhất:

```bash
npm install -g @anthropic-ai/claude-code
```

Gỡ cài đặt:

```bash
npm uninstall -g @anthropic-ai/claude-code
```

Nếu cài đặt lỗi mạng, thử:

```bash
npm install -g @anthropic-ai/claude-code --registry https://registry.npmmirror.com
```
