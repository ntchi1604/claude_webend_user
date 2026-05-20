import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'Codex CLI - Api4Cheap' };

export default function Page() {
  return (
    <DocLayout
      title="Hướng dẫn cài đặt Codex CLI"
      description="Cài đặt Codex CLI chính thức và cấu hình provider Api4Cheap theo hướng dẫn cài đặt."
    >
      <H2>Tổng quan</H2>
      <P>
        <strong>Codex CLI</strong> là AI coding agent chính thức của OpenAI. Cấu hình bên dưới dùng package
        <Inline>@openai/codex</Inline>, xác thực bằng API key và route qua endpoint
        <Inline>https://lccaptcha.io.vn</Inline> với Responses API.
      </P>

      <Callout kind="important">
        Cài đặt nhanh chỉ backup và ghi lại <Inline>auth.json</Inline> cùng <Inline>config.toml</Inline>. Không xoá hoặc di chuyển toàn bộ
        <Inline>~/.codex</Inline>, vì Codex có thể đang giữ file log SQLite trong thư mục này.
      </Callout>

      <Divider />

      <H2>Yêu cầu</H2>
      <Ul>
        <Li>Windows 10 build 17763 / version 1809 trở lên, macOS hoặc Linux.</Li>
        <Li>Node.js và npm nếu cài qua npm; macOS có thể cài bằng Homebrew.</Li>
        <Li>API key từ dashboard Api4Cheap.</Li>
      </Ul>

      <Divider />

      <H2>Bước 1: Cài Codex CLI</H2>
      <P>Chạy một trong hai lệnh sau:</P>
      <Code lang="bash">{`npm install -g @openai/codex
# hoặc
brew install codex`}</Code>
      <P>Kiểm tra cài đặt:</P>
      <Code lang="bash">{`codex -V`}</Code>

      <Divider />

      <H2>Bước 2: Lấy API key</H2>
      <P>Mở trang API key trên dashboard Api4Cheap, tạo key mới và sao chép secret.</P>
      <Callout kind="warn">Hãy giữ key như mật khẩu. Không chia sẻ key trong log, chat công khai hoặc repo.</Callout>

      <Divider />

      <H2>Bước 3: Cài đặt nhanh</H2>
      <Ol>
        <Li>Vào <Link className="link" href="/dashboard/docs">Cài đặt nhanh</Link>.</Li>
        <Li>Chọn tab <strong>Codex CLI</strong>.</Li>
        <Li>Dán API key đầy đủ vào ô <strong>API key</strong>.</Li>
        <Li>Chọn hệ điều hành.</Li>
        <Li>Sao chép lệnh cài đặt và chạy trong PowerShell hoặc terminal.</Li>
      </Ol>
      <P>Script tự động cài <Inline>@openai/codex</Inline> nếu chưa có, backup hai file cấu hình cũ nếu tồn tại, rồi tạo:</P>
      <Code lang="json">{`{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}`}</Code>
      <Code lang="toml">{`model_provider = "api4cheap"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.api4cheap]
name = "Api4Cheap"
base_url = "https://lccaptcha.io.vn/v1"
wire_api = "responses"`}</Code>

      <Divider />

      <H2>Cấu hình thủ công</H2>
      <Ol>
        <Li>Tạo thư mục <Inline>~/.codex</Inline> nếu chưa tồn tại.</Li>
        <Li>Tạo <Inline>auth.json</Inline> với nội dung JSON ở trên.</Li>
        <Li>Tạo <Inline>config.toml</Inline> với nội dung TOML ở trên.</Li>
        <Li>Khởi động lại terminal.</Li>
      </Ol>

      <Divider />

      <H2>Bắt đầu dùng</H2>
      <Code lang="bash">{`cd thu-muc-du-an-cua-ban
codex`}</Code>
      <P>Extension VS Code chính thức của Codex vẫn dùng được với cấu hình này.</P>
    </DocLayout>
  );
}
