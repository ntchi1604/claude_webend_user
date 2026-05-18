# Hướng dẫn cấu hình Codex CLI với Beeknoee

Copy trang

## Codex CLI là gì?

**Codex CLI** là AI coding agent của OpenAI — chạy trực tiếp trong terminal, hỗ trợ viết code, debug, chạy lệnh và tự động hoàn thành task. Beeknoee Platform hỗ trợ Codex CLI thông qua endpoint OpenAI-compatible.

> 💡 Khi dùng Codex CLI qua Beeknoee, bạn có thể dùng **các model OpenAI** (GPT-4.1, o3, o4-mini...) với giá tối ưu và thanh toán bằng VND.

---

## Yêu cầu

* Node.js **22+** ([nodejs.org](https://nodejs.org/))
* API Key từ [Beeknoee Platform](https://platform.beeknoee.com/api-keys)

---

## 📌 Bước 1: Cài đặt Codex CLI

```bash
npm install -g @openai/codex
```

Kiểm tra cài đặt thành công:

```bash
codex --version
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
4. Chọn tab **Codex CLI**
5. **Chọn hệ điều hành** — Windows hoặc macOS / Linux
6. **Chọn Model Mapping** (tuỳ chọn):

   * **Small (Fast)** : Model nhẹ, nhanh — dùng cho task đơn giản (ví dụ: `o4-mini`)
   * **Medium (Default)** : Model mặc định — cân bằng tốc độ/chất lượng (ví dụ: `gpt-4.1`)
   * **Large (Powerful)** : Model mạnh nhất — dùng cho task phức tạp (ví dụ: `o3`)

   > 💡 Chỉ hiện các model OpenAI. Nếu không biết chọn gì, giữ mặc định là ổn!
   >
7. **Copy lệnh** — nhấn nút **Copy** bên cạnh khung lệnh
8. Mở **PowerShell** (Windows) hoặc **Terminal** (macOS/Linux)
9. Dán lệnh và nhấn **Enter**
10. Sau khi cài xong, gõ `codex` để bắt đầu

Script tự động thực hiện:

* ✅ Set `OPENAI_BASE_URL` + `OPENAI_API_KEY`
* ✅ Tạo `~/.codex/config.toml` với model mapping
* ✅ Backup cấu hình cũ (`.beeknoee-backup`)

---

## 📌 Bước 4: Kiểm tra kết nối

```bash
cd /path/to/your/project
codex
```

Codex CLI sẽ tự kết nối đến Beeknoee và sẵn sàng nhận lệnh.
