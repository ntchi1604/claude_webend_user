import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'Claude Code — Api4Cheap' };

export default function Page() {
  return (
    <DocLayout
      title="Hướng dẫn cài đặt Claude Code"
      description="Cài đặt Claude Code client và cấu hình endpoint Api4Cheap theo hướng dẫn cài đặt."
    >
      <H2>Tổng quan</H2>
      <P>
        <strong>Claude Code</strong> là coding client chạy trong terminal. Cấu hình bên dưới dùng package
        <Inline>@anthropic-ai/claude-code</Inline>, xác thực bằng API key và route qua
        <Inline>https://lccaptcha.io.vn</Inline>.
      </P>

      <Callout kind="tip">
        Trên Windows nên chạy Claude Code trong Git Bash để việc xử lý path và quoting ổn định hơn CMD/PowerShell.
      </Callout>

      <Divider />

      <H2>Yêu cầu</H2>
      <Ul>
        <Li>Windows 10 trở lên, macOS hoặc Linux.</Li>
        <Li>Node.js <strong>18+</strong>.</Li>
        <Li>API key từ Api4Cheap dashboard.</Li>
      </Ul>

      <Divider />

      <H2>Bước 1: Cài Git Bash và Node.js</H2>
      <P>Windows nên cài Git for Windows với tùy chọn mặc định. Kiểm tra Node.js:</P>
      <Code lang="bash">{`node --version`}</Code>
      <P>Nếu version nhỏ hơn 18.0.0, cài Node.js LTS rồi mở lại terminal.</P>

      <Divider />

      <H2>Bước 2: Cài Claude Code</H2>
      <Code lang="bash">{`npm install -g @anthropic-ai/claude-code`}</Code>
      <P>Sau khi cài, đóng và mở lại terminal để PATH nhận lệnh <Inline>claude</Inline>.</P>

      <Divider />

      <H2>Bước 3: Lấy API key</H2>
      <P>Mở trang API key trong dashboard Api4Cheap, tạo key mới và sao chép secret.</P>
      <Callout kind="warn">API key chỉ nên lưu ở máy của bạn. Bất kỳ ai có key đều có thể dùng credit của bạn.</Callout>

      <Divider />

      <H2>Bước 4: Cài đặt nhanh</H2>
      <Ol>
        <Li>Vào <Link className="link" href="/dashboard/docs">Cài đặt nhanh</Link>.</Li>
        <Li>Chọn tab <strong>Claude Code</strong>.</Li>
        <Li>Dán API key đầy đủ vào ô <strong>API key</strong>.</Li>
        <Li>Chọn hệ điều hành.</Li>
        <Li>Sao chép lệnh cài đặt và chạy trong PowerShell, Git Bash hoặc terminal.</Li>
      </Ol>
      <P>Script sẽ tạo <Inline>~/.claude/settings.json</Inline> theo mẫu sau:</P>
      <Code lang="json">{`{
  "model": "opus",
  "env": {
    "ANTHROPIC_API_KEY": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "https://lccaptcha.io.vn",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-7"
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "effortLevel": "medium"
}`}</Code>

      <Divider />

      <H2>Cấu hình thủ công</H2>
      <Ol>
        <Li>Nếu <Inline>~/.claude</Inline> chưa tồn tại, chạy <Inline>claude</Inline> một lần để client tạo thư mục.</Li>
        <Li>Tạo hoặc thay thế <Inline>~/.claude/settings.json</Inline> bằng JSON ở trên.</Li>
        <Li>Thay <Inline>YOUR_API_KEY</Inline> bằng secret của bạn.</Li>
        <Li>Khởi động lại terminal.</Li>
      </Ol>

      <Divider />

      <H2>Khởi chạy và kiểm tra</H2>
      <Code lang="bash">{`claude`}</Code>
      <P>Trong Claude Code, có thể gõ <Inline>/status</Inline> để kiểm tra base URL và thông tin auth.</P>

      <Divider />

      <H2>FAQ ngắn</H2>
      <Ul>
        <Li>Cập nhật: chạy lại <Inline>npm install -g @anthropic-ai/claude-code</Inline>.</Li>
        <Li>Gỡ client: <Inline>npm uninstall -g @anthropic-ai/claude-code</Inline>.</Li>
        <Li>Nếu npm lỗi mạng, thử registry mirror: <Inline>npm install -g @anthropic-ai/claude-code --registry https://registry.npmmirror.com</Inline>.</Li>
      </Ul>
    </DocLayout>
  );
}
