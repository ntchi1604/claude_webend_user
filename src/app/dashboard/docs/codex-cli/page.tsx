import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'Codex CLI — Api4Cheap' };

export default function Page() {
  return (
    <DocLayout
      title="Codex CLI Setup Guide"
      description="Cài đặt Codex CLI chính thức và cấu hình provider Api4Cheap theo Codex Setup Guide."
    >
      <H2>Tổng quan</H2>
      <P>
        <strong>Codex CLI</strong> là AI coding agent chính thức của OpenAI. Cấu hình bên dưới dùng package
        <Inline>@openai/codex</Inline>, xác thực bằng API key và route qua endpoint
        <Inline>https://lccaptcha.io.vn</Inline> với Responses API.
      </P>

      <Callout kind="important">
        Cấu hình Codex yêu cầu tạo lại thư mục <Inline>~/.codex</Inline>. Quick Setup sẽ backup cấu hình cũ vào
        <Inline>~/.codex.api4cheap-backup</Inline> trước khi ghi file mới.
      </Callout>

      <Divider />

      <H2>Yêu cầu</H2>
      <Ul>
        <Li>Windows 10 build 17763 / version 1809 trở lên, macOS hoặc Linux.</Li>
        <Li>Node.js và npm nếu cài qua npm; macOS có thể cài bằng Homebrew.</Li>
        <Li>API key từ Api4Cheap dashboard.</Li>
      </Ul>

      <Divider />

      <H2>Bước 1: Cài Codex CLI</H2>
      <P>Chạy một trong hai lệnh sau:</P>
      <Code lang="bash">{`npm install -g @openai/codex
# or
brew install codex`}</Code>
      <P>Kiểm tra cài đặt:</P>
      <Code lang="bash">{`codex -V`}</Code>

      <Divider />

      <H2>Bước 2: Lấy API key</H2>
      <P>Mở trang API Keys trên dashboard Api4Cheap, tạo key mới và copy secret.</P>
      <Callout kind="warn">Treat your key like a password. Không chia sẻ key trong log, chat công khai hoặc repo.</Callout>

      <Divider />

      <H2>Bước 3: Quick Setup</H2>
      <Ol>
        <Li>Vào <Link className="link" href="/dashboard/docs">Quick Setup</Link>.</Li>
        <Li>Chọn tab <strong>Codex CLI</strong>.</Li>
        <Li>Paste API key đầy đủ vào ô <strong>API Key</strong>.</Li>
        <Li>Chọn hệ điều hành.</Li>
        <Li>Copy lệnh cài đặt và chạy trong PowerShell hoặc terminal.</Li>
      </Ol>
      <P>Script tự động cài <Inline>@openai/codex</Inline> nếu chưa có, backup <Inline>~/.codex</Inline>, rồi tạo hai file:</P>
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
base_url = "https://lccaptcha.io.vn"
wire_api = "responses"`}</Code>

      <Divider />

      <H2>Cấu hình thủ công</H2>
      <Ol>
        <Li>Xóa thư mục <Inline>~/.codex</Inline> nếu tồn tại, sau đó tạo lại thư mục này.</Li>
        <Li>Tạo <Inline>auth.json</Inline> với nội dung JSON ở trên.</Li>
        <Li>Tạo <Inline>config.toml</Inline> với nội dung TOML ở trên.</Li>
        <Li>Restart terminal.</Li>
      </Ol>

      <Divider />

      <H2>Bắt đầu dùng</H2>
      <Code lang="bash">{`cd your-project-folder
codex`}</Code>
      <P>VS Code extension chính thức của Codex vẫn dùng được với cấu hình này.</P>
    </DocLayout>
  );
}
