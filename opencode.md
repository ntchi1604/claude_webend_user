# Hướng dẫn cấu hình OpenCode với Beeknoee

Copy trang

## OpenCode là gì?

**OpenCode** là AI coding assistant dạng CLI/TUI — chạy trực tiếp trong terminal, hỗ trợ viết code, debug, và tự động hóa. OpenCode cho phép cấu hình custom API provider tương thích OpenAI, giúp bạn sử dụng Beeknoee API trực tiếp.

> 💡 **Beeknoee API tương thích hoàn toàn với OpenAI SDK** — OpenCode nhận diện Beeknoee như một OpenAI-compatible provider.

---

## Yêu cầu

* **Node.js 18+** (kiểm tra: `node --version`)
* API Key từ [Beeknoee Platform](https://platform.beeknoee.com/api-keys)

---

## 📌 Bước 1: Cài đặt OpenCode

### Cách 1: Cài qua npm (khuyến nghị — Windows/macOS/Linux)

```bash
npm install -g opencode-ai
```

### Cách 2: Cài qua script (macOS/Linux)

```bash
curl -fsSL https://opencode.ai/install | bash
```

Kiểm tra cài thành công:

```bash
opencode --version
```

---

## 📌 Bước 2: Tạo API Key

1. Truy cập [https://platform.beeknoee.com/api-keys](https://platform.beeknoee.com/api-keys)
2. Đăng nhập bằng tài khoản Google
3. Nhấn **"Tạo API Key"**
4. Copy API Key (dạng `sk-bee-xxxx...`)

> ⚠️ API key chỉ hiển thị 24 giờ đầu — copy và lưu ngay!

---

## 📌 Bước 3: Thiết lập biến môi trường

Lưu API key vào biến môi trường để không phải viết trực tiếp vào file config:

**Linux/macOS:**

```bash
export BEEKNOEE_API_KEY="sk-bee-YOUR_API_KEY"
```

Để lưu vĩnh viễn, thêm dòng trên vào `~/.bashrc` hoặc `~/.zshrc`:

```bash
echo 'export BEEKNOEE_API_KEY="sk-bee-YOUR_API_KEY"' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**

```powershell
$env:BEEKNOEE_API_KEY = "sk-bee-YOUR_API_KEY"
```

Để lưu vĩnh viễn:

```powershell
[System.Environment]::SetEnvironmentVariable("BEEKNOEE_API_KEY", "sk-bee-YOUR_API_KEY", "User")
```

---

## 📌 Bước 4: Tạo file cấu hình `opencode.json`

OpenCode sử dụng file `opencode.json` để cấu hình provider. Có 2 vị trí:

| Vị trí          | Đường dẫn                           | Ưu tiên  |
| ----------------- | --------------------------------------- | ---------- |
| **Project** | `./opencode.json` (thư mục dự án) | Cao hơn   |
| **Global**  | `~/.config/opencode/opencode.json`    | Thấp hơn |

> 💡 **Khuyến nghị:** Dùng file global nếu muốn Beeknoee hoạt động ở mọi dự án.

### Config mẫu đầy đủ:

```json
{
  "provider": {
    "beeknoee": {
      "api": "openai-compatible",
      "name": "Beeknoee",
      "options": {
        "baseURL": "https://platform.beeknoee.com/api/v1",
        "apiKey": "{env:BEEKNOEE_API_KEY}"
      },
      "models": {
        "deepseek-chat": {
          "name": "DeepSeek V3.2"
        },
        "deepseek-reasoner": {
          "name": "DeepSeek R1"
        },
        "gpt-5": {
          "name": "GPT-5"
        },
        "gpt-5-mini": {
          "name": "GPT-5 Mini"
        },
        "claude-sonnet-4-6": {
          "name": "Claude Sonnet 4.6"
        },
        "claude-opus-4-6": {
          "name": "Claude Opus 4.6"
        },
        "gemini-3-flash": {
          "name": "Gemini 3 Flash"
        },
        "gemini-3.1-pro-high": {
          "name": "Gemini 3.1 Pro High"
        },
        "glm-4.7-flash": {
          "name": "GLM-4.7 Flash (FREE)"
        }
      }
    }
  }
}
```

> 💡 Xem đầy đủ danh sách Model ID tại trang [Các Mô Hình AI](https://platform.beeknoee.com/models) — ấn nút **Copy ID** trên mỗi card.

> ⚠️  **Windows PowerShell** : Khi tạo file bằng `Set-Content -Encoding UTF8`, PowerShell thêm BOM gây lỗi. Dùng `[System.IO.File]::WriteAllText()` thay thế.

### Config tối giản (1 model):

```json
{
  "provider": {
    "beeknoee": {
      "api": "openai-compatible",
      "name": "Beeknoee",
      "options": {
        "baseURL": "https://platform.beeknoee.com/api/v1",
        "apiKey": "{env:BEEKNOEE_API_KEY}"
      },
      "models": {
        "deepseek-chat": {
          "name": "DeepSeek V3.2"
        }
      }
    }
  }
}
```

---

## 📌 Bước 5: Kết nối qua lệnh `/connect`

Ngoài cách config file, bạn có thể kết nối trực tiếp trong OpenCode:

1. Mở terminal → chạy `opencode`
2. Trong TUI, gõ `/connect`
3. Chọn **"Other"** (custom provider)
4. Nhập API key: `sk-bee-YOUR_API_KEY`

API key sẽ được lưu an toàn tại `~/.local/share/opencode/auth.json`.

---

## 📌 Bước 6: Chọn model và bắt đầu sử dụng

Sau khi config xong, mở OpenCode trong dự án bất kỳ:

```bash
cd /path/to/your/project
opencode
```

Chọn model `beeknoee/deepseek-chat` (hoặc model khác đã config) và bắt đầu coding!
