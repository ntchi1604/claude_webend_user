# Hướng dẫn cấu hình Claude Code với Beeknoee

Copy trang

## Claude Code là gì?

**Claude Code** là AI coding assistant của Anthropic — chạy trực tiếp trong terminal, hỗ trợ viết code, debug, quản lý file và chạy lệnh. Beeknoee Platform hỗ trợ Claude Code thông qua endpoint Anthropic Messages API tương thích.

> 💡 Khi dùng Claude Code qua Beeknoee, bạn có thể gọi **tất cả 32+ models** (không chỉ Claude) — hệ thống tự route phù hợp.

---

## Yêu cầu

* Node.js **18+** ([nodejs.org](https://nodejs.org/))
* API Key từ [Beeknoee Platform](https://platform.beeknoee.com/api-keys)

---

## 📌 Bước 1: Cài đặt Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Kiểm tra cài đặt thành công:

```bash
claude --version
```

---

## 📌 Bước 2: Tạo API Key

1. Truy cập [https://platform.beeknoee.com/api-keys](https://platform.beeknoee.com/api-keys)
2. Đăng nhập bằng tài khoản Google
3. Nhấn **"Tạo API Key"**
4. Copy API Key (dạng `sk-bee-xxxx...`)

> ⚠️ API key chỉ hiển thị 24 giờ đầu — copy và lưu ngay!

---

## 🚀 Bước 3: Cấu hình qua Quick Setup (khuyên dùng)

Cách nhanh nhất — hệ thống tự sinh lệnh cài đặt cho bạn:

1. Vào trang [API Keys](https://platform.beeknoee.com/api-keys)
2. Chọn API Key bạn muốn dùng → nhấn **⚙️ Cấu hình API Key**
3. Trong dialog, chuyển sang tab **"Quick Setup"**
4. Chọn tab **Claude Code** (mặc định đã chọn)
5. **Chọn hệ điều hành** — Windows hoặc macOS / Linux
6. **Chọn Model Mapping** (tuỳ chọn):

   * **Haiku (Fast)** : Model nhanh, nhẹ — dùng cho task đơn giản
   * **Sonnet (Default)** : Model mặc định khi gõ `claude` — cân bằng tốc độ/chất lượng
   * **Opus (Powerful)** : Model mạnh nhất — dùng cho task phức tạp

   > 💡 Nếu không biết chọn gì, giữ mặc định là ổn!
   >
7. **Copy lệnh** — nhấn nút **Copy** bên cạnh khung lệnh
8. Mở **PowerShell** (Windows) hoặc **Terminal** (macOS/Linux)
9. Dán lệnh và nhấn **Enter**
10. Sau khi cài xong, gõ `claude` để bắt đầu

Script tự động thực hiện:

* ✅ Set `ANTHROPIC_BASE_URL` + `ANTHROPIC_API_KEY`
* ✅ Smart merge `settings.json` (giữ nguyên cấu hình cũ)
* ✅ Cài đặt **statusline** (hiển thị số dư, model, chi phí)
* ✅ Bypass onboarding
* ✅ Backup cấu hình cũ (`.beeknoee-backup`)

---

## 📌 Bước 4: Kiểm tra kết nối

```bash
cd /path/to/your/project
claude
```

### Trust workspace → Chọn **Yes**

```
Quick safety check: Is this a project you created or one you trust?

> 1. Yes, I trust this folder
  2. No, exit
```

👉 Chọn **1. Yes, I trust this folder** → Enter

### Xem trạng thái

Trong Claude Code, gõ `/status` để xem:

* **Anthropic base URL** → phải là `https://platform.beeknoee.com/api`
* **Auth** → phải hiện API key
