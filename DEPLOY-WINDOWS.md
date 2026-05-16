# Deploy Windows VPS

## 1. Build production

```powershell
cd c:\Work\claude_webend_user
npm install --omit=dev=false
npx prisma generate
npm run build
```

> Lần đầu trên VPS mới: `npx prisma db push && npm run db:seed`

## 2. Chạy bằng PM2 (khuyên dùng)

```powershell
npm i -g pm2 pm2-windows-startup
pm2-startup install

pm2 start npm --name claude-webend -- start
pm2 save
```

Log: `pm2 logs claude-webend`  
Restart: `pm2 restart claude-webend`  
Stop: `pm2 stop claude-webend`

## 3. Caddy reverse proxy + auto HTTPS

Cài Caddy: https://caddyserver.com/download (Windows binary)

File `Caddyfile`:

```
api.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
    encode gzip zstd
    header {
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

Chạy:
```powershell
caddy run --config Caddyfile
```
Hoặc cài service:
```powershell
caddy start
```

## 4. Mở firewall

```powershell
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

## 5. Backup SQLite

Lịch task Windows chạy mỗi đêm:
```powershell
$d = Get-Date -Format "yyyyMMdd-HHmm"
Copy-Item .\prisma\dev.db .\backups\dev-$d.db
```

## 6. Nâng cấp

```powershell
git pull          # nếu dùng git
npm install
npx prisma db push
npm run build
pm2 restart claude-webend
```

## ENV production cần đổi

```
DATABASE_URL="file:./prod.db"
JWT_SECRET="<random 64+ chars>"
ROUTER_BASE_URL="http://127.0.0.1:8000"
ROUTER_API_KEY="<key của 9router nếu có>"
APP_URL="https://api.yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="<mật khẩu mạnh>"
RATE_RPM=120
RATE_TPM=500000
```

## Bảo mật

- Đặt SQLite trong thư mục có ACL hạn chế.
- Đổi `JWT_SECRET` → invalidate toàn bộ session cũ.
- Block port 3000 khỏi internet, chỉ Caddy mới truy cập 127.0.0.1:3000.
