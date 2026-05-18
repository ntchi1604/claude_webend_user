import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider, Table, THead, TR, TH, TD } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'OpenCode — Tài liệu' };

export default function Page() {
  return (
    <DocLayout
      title="Hướng dẫn cấu hình OpenCode với Api4Cheap"
      description="Cấu hình AI coding assistant OpenCode với Api4Cheap API"
    >
      <H2>OpenCode là gì?</H2>
      <P>
        <strong>OpenCode</strong> là AI coding assistant dạng CLI/TUI — chạy trực tiếp trong terminal, hỗ trợ viết code, debug, và tự động hóa. OpenCode cho phép cấu hình custom API provider tương thích OpenAI, giúp bạn sử dụng Api4Cheap API trực tiếp.
      </P>
      <Callout kind="tip">
        💡 <strong>Api4Cheap API tương thích hoàn toàn với OpenAI SDK</strong> — OpenCode nhận diện Api4Cheap như một OpenAI-compatible provider.
      </Callout>

      <Divider />

      <H2>Yêu cầu</H2>
      <Ul>
        <Li><strong>Node.js 18+</strong> (kiểm tra: <Inline>node --version</Inline>)</Li>
        <Li>API Key từ <Link className="link" href="/dashboard/keys">Api4Cheap Platform</Link></Li>
      </Ul>

      <Divider />

      <H2>📌 Bước 1: Cài đặt OpenCode</H2>
      <P><strong>Cách 1: Cài qua npm (khuyến nghị — Windows/macOS/Linux)</strong></P>
      <Code lang="bash">{`npm install -g opencode-ai`}</Code>
      <P><strong>Cách 2: Cài qua script (macOS/Linux)</strong></P>
      <Code lang="bash">{`curl -fsSL https://opencode.ai/install | bash`}</Code>
      <P>Kiểm tra cài thành công:</P>
      <Code lang="bash">{`opencode --version`}</Code>

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

      <H2>📌 Bước 3: Thiết lập biến môi trường</H2>
      <P>Lưu API key vào biến môi trường để không phải viết trực tiếp vào file config:</P>
      <P><strong>Linux/macOS:</strong></P>
      <Code lang="bash">{`export API4CHEAP_API_KEY="sk-cw-YOUR_API_KEY"`}</Code>
      <P>Để lưu vĩnh viễn, thêm dòng trên vào <Inline>~/.bashrc</Inline> hoặc <Inline>~/.zshrc</Inline>:</P>
      <Code lang="bash">{`echo 'export API4CHEAP_API_KEY="sk-cw-YOUR_API_KEY"' >> ~/.bashrc
source ~/.bashrc`}</Code>
      <P><strong>Windows (PowerShell):</strong></P>
      <Code lang="powershell">{`$env:API4CHEAP_API_KEY = "sk-cw-YOUR_API_KEY"`}</Code>
      <P>Để lưu vĩnh viễn:</P>
      <Code lang="powershell">{`[System.Environment]::SetEnvironmentVariable("API4CHEAP_API_KEY", "sk-cw-YOUR_API_KEY", "User")`}</Code>

      <Divider />

      <H2>📌 Bước 4: Tạo file cấu hình opencode.json</H2>
      <P>OpenCode sử dụng file <Inline>opencode.json</Inline> để cấu hình provider. Có 2 vị trí:</P>
      <Table>
        <THead><TR><TH>Vị trí</TH><TH>Đường dẫn</TH><TH>Ưu tiên</TH></TR></THead>
        <tbody>
          <TR><TD><strong>Project</strong></TD><TD><Inline>./opencode.json</Inline> (thư mục dự án)</TD><TD>Cao hơn</TD></TR>
          <TR><TD><strong>Global</strong></TD><TD><Inline>~/.config/opencode/opencode.json</Inline></TD><TD>Thấp hơn</TD></TR>
        </tbody>
      </Table>
      <Callout kind="tip">💡 <strong>Khuyến nghị:</strong> Dùng file global nếu muốn Api4Cheap hoạt động ở mọi dự án.</Callout>

      <H2>Config mẫu đầy đủ</H2>
      <Code lang="json">{`{
  "provider": {
    "api4cheap": {
      "api": "openai-compatible",
      "name": "Api4Cheap",
      "options": {
        "baseURL": "https://lccaptcha.io.vn/v1",
        "apiKey": "{env:API4CHEAP_API_KEY}"
      },
      "models": {
        "deepseek-chat": { "name": "DeepSeek V3.2" },
        "deepseek-reasoner": { "name": "DeepSeek R1" },
        "gpt-5": { "name": "GPT-5" },
        "gpt-5-mini": { "name": "GPT-5 Mini" },
        "claude-sonnet-4-6": { "name": "Claude Sonnet 4.6" },
        "claude-opus-4-6": { "name": "Claude Opus 4.6" },
        "gemini-3-flash": { "name": "Gemini 3 Flash" },
        "gemini-3.1-pro-high": { "name": "Gemini 3.1 Pro High" },
        "glm-4.7-flash": { "name": "GLM-4.7 Flash (FREE)" }
      }
    }
  }
}`}</Code>
      <Callout kind="tip">💡 Xem đầy đủ danh sách Model ID tại <Link className="link" href="/dashboard">trang Models</Link> — ấn nút <strong>Copy ID</strong> trên mỗi card.</Callout>
      <Callout kind="warn">
        ⚠️ <strong>Windows PowerShell:</strong> Khi tạo file bằng <Inline>Set-Content -Encoding UTF8</Inline>, PowerShell thêm BOM gây lỗi. Dùng <Inline>[System.IO.File]::WriteAllText()</Inline> thay thế.
      </Callout>

      <H2>Config tối giản (1 model)</H2>
      <Code lang="json">{`{
  "provider": {
    "api4cheap": {
      "api": "openai-compatible",
      "name": "Api4Cheap",
      "options": {
        "baseURL": "https://lccaptcha.io.vn/v1",
        "apiKey": "{env:API4CHEAP_API_KEY}"
      },
      "models": {
        "deepseek-chat": { "name": "DeepSeek V3.2" }
      }
    }
  }
}`}</Code>

      <Divider />

      <H2>📌 Bước 5: Kết nối qua lệnh /connect</H2>
      <P>Ngoài cách config file, bạn có thể kết nối trực tiếp trong OpenCode:</P>
      <Ol>
        <Li>Mở terminal → chạy <Inline>opencode</Inline></Li>
        <Li>Trong TUI, gõ <Inline>/connect</Inline></Li>
        <Li>Chọn <strong>&quot;Other&quot;</strong> (custom provider)</Li>
        <Li>Nhập API key: <Inline>sk-cw-YOUR_API_KEY</Inline></Li>
      </Ol>
      <P>API key sẽ được lưu an toàn tại <Inline>~/.local/share/opencode/auth.json</Inline>.</P>

      <Divider />

      <H2>📌 Bước 6: Chọn model và bắt đầu sử dụng</H2>
      <P>Sau khi config xong, mở OpenCode trong dự án bất kỳ:</P>
      <Code lang="bash">{`cd /path/to/your/project
opencode`}</Code>
      <P>Chọn model <Inline>api4cheap/deepseek-chat</Inline> (hoặc model khác đã config) và bắt đầu coding!</P>
    </DocLayout>
  );
}
