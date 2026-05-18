import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'Claude Code — Tài liệu' };

export default function Page() {
  return (
    <DocLayout
      title="Hướng dẫn cấu hình Claude Code với Api4Cheap"
      description="Cấu hình Claude Code (Anthropic) với Api4Cheap API"
    >
      <H2>Claude Code là gì?</H2>
      <P>
        <strong>Claude Code</strong> là AI coding assistant của Anthropic — chạy trực tiếp trong terminal, hỗ trợ viết code, debug, quản lý file và chạy lệnh. Api4Cheap Platform hỗ trợ Claude Code thông qua endpoint Anthropic Messages API tương thích.
      </P>
      <Callout kind="tip">
        💡 Khi dùng Claude Code qua Api4Cheap, bạn có thể gọi <strong>tất cả 32+ models</strong> (không chỉ Claude) — hệ thống tự route phù hợp.
      </Callout>

      <Divider />

      <H2>Yêu cầu</H2>
      <Ul>
        <Li>Node.js <strong>18+</strong> (<a className="link" href="https://nodejs.org/" target="_blank" rel="noreferrer">nodejs.org</a>)</Li>
        <Li>API Key từ <Link className="link" href="/dashboard/keys">Api4Cheap Platform</Link></Li>
      </Ul>

      <Divider />

      <H2>📌 Bước 1: Cài đặt Claude Code</H2>
      <Code lang="bash">{`npm install -g @anthropic-ai/claude-code`}</Code>
      <P>Kiểm tra cài đặt thành công:</P>
      <Code lang="bash">{`claude --version`}</Code>

      <Divider />

      <H2>📌 Bước 2: Tạo API Key</H2>
      <Ol>
        <Li>Truy cập <Link className="link" href="/dashboard/keys">trang API Keys</Link></Li>
        <Li>Đăng nhập bằng tài khoản Google</Li>
        <Li>Nhấn <strong>&quot;Tạo API Key&quot;</strong></Li>
        <Li>Copy API Key (dạng <Inline>sk-cw-xxxx...</Inline>)</Li>
      </Ol>
      <Callout kind="warn">⚠️ API key chỉ hiển thị 24 giờ đầu — copy và lưu ngay!</Callout>

      <Divider />

      <H2>🚀 Bước 3: Cấu hình qua Quick Setup (khuyên dùng)</H2>
      <P>Cách nhanh nhất — hệ thống tự sinh lệnh cài đặt cho bạn:</P>
      <Ol>
        <Li>Vào trang <Link className="link" href="/dashboard/docs">Quick Setup</Link></Li>
        <Li>Chọn tab <strong>Claude Code</strong> (mặc định đã chọn)</Li>
        <Li>Paste <strong>API Key</strong> đầy đủ vào ô</Li>
        <Li><strong>Chọn hệ điều hành</strong> — Windows hoặc macOS / Linux</Li>
        <Li>
          <strong>Chọn Model Mapping</strong> (tuỳ chọn):
          <Ul>
            <Li><strong>Haiku (Fast)</strong>: Model nhanh, nhẹ — dùng cho task đơn giản</Li>
            <Li><strong>Sonnet (Default)</strong>: Model mặc định khi gõ <Inline>claude</Inline> — cân bằng tốc độ/chất lượng</Li>
            <Li><strong>Opus (Powerful)</strong>: Model mạnh nhất — dùng cho task phức tạp</Li>
          </Ul>
          <Callout kind="tip">💡 Nếu không biết chọn gì, giữ mặc định là ổn!</Callout>
        </Li>
        <Li><strong>Copy lệnh</strong> — nhấn nút <strong>Copy</strong> bên cạnh khung lệnh</Li>
        <Li>Mở <strong>PowerShell</strong> (Windows) hoặc <strong>Terminal</strong> (macOS/Linux)</Li>
        <Li>Dán lệnh và nhấn <strong>Enter</strong></Li>
        <Li>Sau khi cài xong, gõ <Inline>claude</Inline> để bắt đầu</Li>
      </Ol>
      <P>Script tự động thực hiện:</P>
      <Ul>
        <Li>✅ Set <Inline>ANTHROPIC_BASE_URL</Inline> + <Inline>ANTHROPIC_API_KEY</Inline></Li>
        <Li>✅ Smart merge <Inline>settings.json</Inline> (giữ nguyên cấu hình cũ)</Li>
        <Li>✅ Bypass onboarding</Li>
        <Li>✅ Backup cấu hình cũ (<Inline>.api4cheap-backup</Inline>)</Li>
      </Ul>

      <Divider />

      <H2>📌 Bước 4: Kiểm tra kết nối</H2>
      <Code lang="bash">{`cd /path/to/your/project
claude`}</Code>
      <H2>Trust workspace → Chọn Yes</H2>
      <Code>{`Quick safety check: Is this a project you created or one you trust?

> 1. Yes, I trust this folder
  2. No, exit`}</Code>
      <P>👉 Chọn <strong>1. Yes, I trust this folder</strong> → Enter</P>

      <H2>Xem trạng thái</H2>
      <P>Trong Claude Code, gõ <Inline>/status</Inline> để xem:</P>
      <Ul>
        <Li><strong>Anthropic base URL</strong> → phải là endpoint của Api4Cheap</Li>
        <Li><strong>Auth</strong> → phải hiện API key</Li>
      </Ul>
    </DocLayout>
  );
}
