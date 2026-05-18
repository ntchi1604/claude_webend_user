import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'Codex CLI — Tài liệu' };

export default function Page() {
  return (
    <DocLayout
      title="Hướng dẫn cấu hình Codex CLI với Api4Cheap"
      description="Cấu hình Codex CLI (OpenAI) với Api4Cheap API"
    >
      <H2>Codex CLI là gì?</H2>
      <P>
        <strong>Codex CLI</strong> là AI coding agent của OpenAI — chạy trực tiếp trong terminal, hỗ trợ viết code, debug, chạy lệnh và tự động hoàn thành task. Api4Cheap Platform hỗ trợ Codex CLI thông qua endpoint OpenAI-compatible.
      </P>
      <Callout kind="tip">
        💡 Khi dùng Codex CLI qua Api4Cheap, bạn có thể dùng <strong>các model OpenAI</strong> (GPT-4.1, o3, o4-mini...) với giá tối ưu và thanh toán bằng VND.
      </Callout>

      <Divider />

      <H2>Yêu cầu</H2>
      <Ul>
        <Li>Node.js <strong>22+</strong> (<a className="link" href="https://nodejs.org/" target="_blank" rel="noreferrer">nodejs.org</a>)</Li>
        <Li>API Key từ <Link className="link" href="/dashboard/keys">Api4Cheap Platform</Link></Li>
      </Ul>

      <Divider />

      <H2>📌 Bước 1: Cài đặt Codex CLI</H2>
      <Code lang="bash">{`npm install -g @openai/codex`}</Code>
      <P>Kiểm tra cài đặt thành công:</P>
      <Code lang="bash">{`codex --version`}</Code>

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
        <Li>Chọn tab <strong>Codex CLI</strong></Li>
        <Li>Paste <strong>API Key</strong> đầy đủ vào ô</Li>
        <Li><strong>Chọn hệ điều hành</strong> — Windows hoặc macOS / Linux</Li>
        <Li>
          <strong>Chọn Model Mapping</strong> (tuỳ chọn):
          <Ul>
            <Li><strong>Small (Fast)</strong>: Model nhẹ, nhanh — task đơn giản (ví dụ: <Inline>o4-mini</Inline>)</Li>
            <Li><strong>Medium (Default)</strong>: Model mặc định — cân bằng tốc độ/chất lượng (ví dụ: <Inline>gpt-4.1</Inline>)</Li>
            <Li><strong>Large (Powerful)</strong>: Model mạnh nhất — task phức tạp (ví dụ: <Inline>o3</Inline>)</Li>
          </Ul>
          <Callout kind="tip">💡 Chỉ hiện các model OpenAI. Nếu không biết chọn gì, giữ mặc định là ổn!</Callout>
        </Li>
        <Li><strong>Copy lệnh</strong> — nhấn nút <strong>Copy</strong> bên cạnh khung lệnh</Li>
        <Li>Mở <strong>PowerShell</strong> (Windows) hoặc <strong>Terminal</strong> (macOS/Linux)</Li>
        <Li>Dán lệnh và nhấn <strong>Enter</strong></Li>
        <Li>Sau khi cài xong, gõ <Inline>codex</Inline> để bắt đầu</Li>
      </Ol>
      <P>Script tự động thực hiện:</P>
      <Ul>
        <Li>✅ Set <Inline>OPENAI_BASE_URL</Inline> + <Inline>OPENAI_API_KEY</Inline></Li>
        <Li>✅ Tạo <Inline>~/.codex/config.toml</Inline> với model mapping</Li>
        <Li>✅ Backup cấu hình cũ (<Inline>.api4cheap-backup</Inline>)</Li>
      </Ul>

      <Divider />

      <H2>📌 Bước 4: Kiểm tra kết nối</H2>
      <Code lang="bash">{`cd /path/to/your/project
codex`}</Code>
      <P>Codex CLI sẽ tự kết nối đến Api4Cheap và sẵn sàng nhận lệnh.</P>
    </DocLayout>
  );
}
