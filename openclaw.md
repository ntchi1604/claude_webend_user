# HƯỚNG DẪN CẤU HÌNH BEE API VỚI OPENCLAW

Copy trang

## 9Router là gì?

**9Router** là một AI proxy miễn phí giúp kết nối OpenClaw với các provider AI (bao gồm Beeknoee) thông qua giao diện Dashboard trực quan —  **không cần sửa file JSON tay** .

---

## Yêu cầu

* **Windows:** Windows 10 (Build 19041+) hoặc Windows 11, có WSL2 + Ubuntu
* **macOS:** macOS 14 trở lên
* OpenClaw đã được cài đặt
* API Key từ [Beeknoee Platform](https://platform.beeknoee.com/api-keys)

---

## 📌 Hướng dẫn tạo API Key

1. Truy cập [https://platform.beeknoee.com/api-keys](https://platform.beeknoee.com/api-keys)
2. Đăng nhập bằng tài khoản Google của bạn
3. Nhấn nút **"Create API Key"**
4. Nhập tên cho API Key (ví dụ:  **"OpenClaw"** )
5. Nhấn **"Create"**
6. **Copy API Key** vừa tạo

> [!NOTE] **Ví dụ minh họa:**
>
> * API Key: `sk-bee-c6ccac913dbc41eea22xxxxxx`
> * Model: `GPT-5-Nano`

---

## BƯỚC 1: Mở Terminal

**Windows:** Nhấn phím **Windows** → gõ **"Ubuntu"** → nhấn **Enter**

**macOS:** Nhấn **Command (⌘) + Space** → gõ **"Terminal"** → nhấn **Enter**

![Mở Ubuntu](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-1.webp)

> [!IMPORTANT] Trên Windows, tất cả các lệnh đều chạy trong  **terminal Ubuntu (WSL2)** , KHÔNG phải PowerShell hay CMD.

---

## BƯỚC 2: Cài 9Router

```bash
npm install -g 9router
```

## BƯỚC 3: Khởi động 9Router

```bash
9router
```

Chọn **★ Web UI (Open in Browser)** → Dashboard tự mở tại:

```
http://localhost:20128
```

![Khởi động 9router](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-3.webp)

> **Windows:** WSL2 tự động forward port, nên truy cập `localhost:20128` trên trình duyệt Windows bình thường.

---

## BƯỚC 4: Thêm Beeknoee vào 9Router

1. Trong Dashboard, vào **Providers**

![Thêm Beeknoee vào 9Router](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-4.webp)

2. Nhấn **Add OpenAI Compatible**
3. Điền thông tin:

| Field              | Giá trị                                 |
| ------------------ | ----------------------------------------- |
| **Name**     | `Beeknoee AI`                           |
| **Prefix**   | `beeknoee`                              |
| **API Type** | `Chat Completions`                      |
| **Base URL** | `https://platform.beeknoee.com/api/v1`  |
| **API Key**  | `sk-bee-xxxx` (API key thật của bạn) |

![Điền thông tin Compatible](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-5.webp)

4. Nhấn **Check** để kiểm tra kết nối
5. Nhấn **Create**

> [!TIP] 🦞 **Mẹo:** API Key có thể copy từ trang [API Keys](https://platform.beeknoee.com/api-keys).

## BƯỚC 5: vào Provider → chọn beekneoe (Nếu đã cấu hình như bước 4 bạn sẽ thấy Beeknoee xuất hiện)

1. Thêm API key vào 9Router của Beeknoee AI

![Chọn menu CLI Tools trong Dashboard](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-6-1.webp)

Điền lại giá trị và API key bạn vừa điền, nhớ ấn check để đảm bảo API key đúng.

![Add Beeknoee AI API Key](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-6-2.webp)

![Add Beeknoee AI API Key](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-6.webp)

Ra ngoài bạn sẽ thấy API key Active như bên dưới là chuẩn

![API Key Active](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-7.webp)

2. Thêm model vào 9Router của Beeknoee AI

* Ở ô Availabe Models

![Chọn menu CLI Tools trong Dashboard](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-8.webp)

* Vào website [https://platform.beeknoee.com/models](https://platform.beeknoee.com/models) Chọn model bạn muốn sử dụng và copy bằng cách ấn vào nút ID của model.

![Copy ID model](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-9.webp)

* Thêm vào dòng Models ID như hình dưới và ấn Add

![Add Model](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-10.webp)

---

## BƯỚC 6: Kết nối OpenClaw qua 9Router

### Kết nối model AI với OpenClaw qua CLI Tools trong Dashboard

1. Dashboard → **CLI Tools** → **OpenClaw**

Nếu bạn đã cài và kết nối OpenClaw với 9Router thành công bạn sẽ thấy giao diện như hình dưới đây:

![OpenClaw đã được cài và kết nối](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-11.webp)

2. Ô **Model** → quay lại dashboard → Providers → Beeknoee AI → Copy model bạn muốn sử dụng

![Copy model](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-12.webp)

3. Dán model vào ô Model và ấn Apply

![Apply model](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-13.webp)

9Router sẽ **tự sửa** file config OpenClaw cho bạn ✅

---

## BƯỚC 7: TEST

### Test qua Web UI:

1. Mở trình duyệt → truy cập **[http://localhost:18789](http://localhost:18789/)**
2. Gõ **"hello"** → bot trả lời = thành công! ✅

![Test Model](https://media.beeknoee.com/storage/media/platform/docs/openclaw-9Router-14.webp)

### Test qua Telegram:

1. Mở Telegram → tìm bot của bạn → gửi **"hello"**
2. Nếu bot không trả lời, cần pair lại:

```bash
openclaw pairing list
openclaw pairing approve telegram <code>
```

---

## Lưu ý quan trọng

> [!IMPORTANT] **9Router phải luôn chạy** khi sử dụng OpenClaw, vì OpenClaw gọi model qua `localhost:20128`.
>
> Để 9Router chạy nền, dùng **PM2** (trình quản lý process):
>
> ```bash
> # Cài PM2 (chỉ cần 1 lần)
> npm install -g pm2
>
> # Chạy 9Router nền
> pm2 start 9router --name 9router
> pm2 save
>
> # Tự khởi động khi restart máy/WSL
> pm2 startup
> ```
> Một số lệnh PM2 hữu ích:
>
> ```bash
> pm2 status          # Xem trạng thái
> pm2 logs 9router    # Xem log
> pm2 restart 9router # Restart
> pm2 stop 9router    # Tạm dừng
> ```
