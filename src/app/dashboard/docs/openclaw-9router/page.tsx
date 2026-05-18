import { DocLayout, H2, H3, P, Code, Inline, Callout, Ol, Li, Ul, Divider, Img, Table, THead, TR, TH, TD } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'OpenClaw + 9Router — Tài liệu' };

export default function Page() {
  return (
    <DocLayout
      title="Hướng dẫn cấu hình Bee API với OpenClaw"
      description="Kết nối OpenClaw với Api4Cheap qua 9Router proxy"
    >
      <H2>9Router là gì?</H2>
      <P>
        <strong>9Router</strong> là một AI proxy miễn phí giúp kết nối OpenClaw với các provider AI (bao gồm Api4Cheap) thông qua giao diện Dashboard trực quan — <strong>không cần sửa file JSON tay</strong>.
      </P>

      <Divider />

      <H2>Yêu cầu</H2>
      <Ul>
        <Li><strong>Windows:</strong> Windows 10 (Build 19041+) hoặc Windows 11, có WSL2 + Ubuntu</Li>
        <Li><strong>macOS:</strong> macOS 14 trở lên</Li>
        <Li>OpenClaw đã được cài đặt</Li>
        <Li>API Key từ <Link className="link" href="/dashboard/keys">Api4Cheap Platform</Link></Li>
      </Ul>

      <Divider />

      <H2>📌 Hướng dẫn tạo API Key</H2>
      <Ol>
        <Li>Truy cập <Link className="link" href="/dashboard/keys">trang API Keys</Link></Li>
        <Li>Đăng nhập bằng tài khoản Google của bạn</Li>
        <Li>Nhấn nút <strong>&quot;Create API Key&quot;</strong></Li>
        <Li>Nhập tên cho API Key (ví dụ: <strong>&quot;OpenClaw&quot;</strong>)</Li>
        <Li>Nhấn <strong>&quot;Create&quot;</strong></Li>
        <Li><strong>Copy API Key</strong> vừa tạo</Li>
      </Ol>
      <Callout kind="info">
        <strong>Ví dụ minh họa:</strong>
        <Ul>
          <Li>API Key: <Inline>sk-cw-c6ccac913dbc41eea22xxxxxx</Inline></Li>
          <Li>Model: <Inline>GPT-5-Nano</Inline></Li>
        </Ul>
      </Callout>

      <Divider />

      <H2>BƯỚC 1: Mở Terminal</H2>
      <P><strong>Windows:</strong> Nhấn phím <strong>Windows</strong> → gõ <strong>&quot;Ubuntu&quot;</strong> → nhấn <strong>Enter</strong></P>
      <P><strong>macOS:</strong> Nhấn <strong>Command (⌘) + Space</strong> → gõ <strong>&quot;Terminal&quot;</strong> → nhấn <strong>Enter</strong></P>
      <Img src="/docs/openclaw/openclaw-9Router-1.webp" alt="Mở Ubuntu" />
      <Callout kind="important">
        Trên Windows, tất cả các lệnh đều chạy trong <strong>terminal Ubuntu (WSL2)</strong>, KHÔNG phải PowerShell hay CMD.
      </Callout>

      <Divider />

      <H2>BƯỚC 2: Cài 9Router</H2>
      <Code lang="bash">{`npm install -g 9router`}</Code>

      <H2>BƯỚC 3: Khởi động 9Router</H2>
      <Code lang="bash">{`9router`}</Code>
      <P>Chọn <strong>★ Web UI (Open in Browser)</strong> → Dashboard tự mở tại:</P>
      <Code>{`http://localhost:20128`}</Code>
      <Img src="/docs/openclaw/openclaw-9Router-3.webp" alt="Khởi động 9router" />
      <Callout kind="info">
        <strong>Windows:</strong> WSL2 tự động forward port, nên truy cập <Inline>localhost:20128</Inline> trên trình duyệt Windows bình thường.
      </Callout>

      <Divider />

      <H2>BƯỚC 4: Thêm Api4Cheap vào 9Router</H2>
      <Ol>
        <Li>Trong Dashboard, vào <strong>Providers</strong></Li>
      </Ol>
      <Img src="/docs/openclaw/openclaw-9Router-4.webp" alt="Thêm Api4Cheap vào 9Router" />
      <Ol>
        <Li>Nhấn <strong>Add OpenAI Compatible</strong></Li>
        <Li>Điền thông tin:</Li>
      </Ol>
      <Table>
        <THead><TR><TH>Field</TH><TH>Giá trị</TH></TR></THead>
        <tbody>
          <TR><TD><strong>Name</strong></TD><TD><Inline>Api4Cheap AI</Inline></TD></TR>
          <TR><TD><strong>Prefix</strong></TD><TD><Inline>api4cheap</Inline></TD></TR>
          <TR><TD><strong>API Type</strong></TD><TD><Inline>Chat Completions</Inline></TD></TR>
          <TR><TD><strong>Base URL</strong></TD><TD><Inline>https://lccaptcha.io.vn/v1</Inline></TD></TR>
          <TR><TD><strong>API Key</strong></TD><TD><Inline>sk-cw-xxxx</Inline> (API key thật của bạn)</TD></TR>
        </tbody>
      </Table>
      <Img src="/docs/openclaw/openclaw-9Router-5.webp" alt="Điền thông tin Compatible" />
      <Ol>
        <Li>Nhấn <strong>Check</strong> để kiểm tra kết nối</Li>
        <Li>Nhấn <strong>Create</strong></Li>
      </Ol>
      <Callout kind="tip">
        🦞 <strong>Mẹo:</strong> API Key có thể copy từ <Link className="link" href="/dashboard/keys">trang API Keys</Link>.
      </Callout>

      <H2>BƯỚC 5: Vào Provider → chọn Api4Cheap</H2>
      <P>Nếu đã cấu hình như bước 4 bạn sẽ thấy Api4Cheap xuất hiện.</P>
      <H3>1. Thêm API key vào 9Router của Api4Cheap AI</H3>
      <Img src="/docs/openclaw/openclaw-9Router-6-1.webp" alt="Chọn menu CLI Tools trong Dashboard" />
      <P>Điền lại giá trị và API key bạn vừa điền, nhớ ấn check để đảm bảo API key đúng.</P>
      <Img src="/docs/openclaw/openclaw-9Router-6-2.webp" alt="Add Api4Cheap AI API Key" />
      <Img src="/docs/openclaw/openclaw-9Router-6.webp" alt="Add Api4Cheap AI API Key" />
      <P>Ra ngoài bạn sẽ thấy API key Active như bên dưới là chuẩn:</P>
      <Img src="/docs/openclaw/openclaw-9Router-7.webp" alt="API Key Active" />

      <H3>2. Thêm model vào 9Router của Api4Cheap AI</H3>
      <Ul>
        <Li>Ở ô <strong>Available Models</strong></Li>
      </Ul>
      <Img src="/docs/openclaw/openclaw-9Router-8.webp" alt="Available Models" />
      <Ul>
        <Li>Vào trang <Link className="link" href="/dashboard">Models</Link> — chọn model bạn muốn sử dụng và copy bằng cách ấn vào nút ID của model.</Li>
      </Ul>
      <Img src="/docs/openclaw/openclaw-9Router-9.webp" alt="Copy ID model" />
      <Ul>
        <Li>Thêm vào dòng Models ID như hình dưới và ấn <strong>Add</strong></Li>
      </Ul>
      <Img src="/docs/openclaw/openclaw-9Router-10.webp" alt="Add Model" />

      <Divider />

      <H2>BƯỚC 6: Kết nối OpenClaw qua 9Router</H2>
      <H3>Kết nối model AI với OpenClaw qua CLI Tools trong Dashboard</H3>
      <Ol>
        <Li>Dashboard → <strong>CLI Tools</strong> → <strong>OpenClaw</strong></Li>
      </Ol>
      <P>Nếu bạn đã cài và kết nối OpenClaw với 9Router thành công bạn sẽ thấy giao diện như hình dưới:</P>
      <Img src="/docs/openclaw/openclaw-9Router-11.webp" alt="OpenClaw đã được cài và kết nối" />
      <Ol>
        <Li>Ô <strong>Model</strong> → quay lại dashboard → Providers → Api4Cheap AI → Copy model bạn muốn sử dụng</Li>
      </Ol>
      <Img src="/docs/openclaw/openclaw-9Router-12.webp" alt="Copy model" />
      <Ol>
        <Li>Dán model vào ô Model và ấn <strong>Apply</strong></Li>
      </Ol>
      <Img src="/docs/openclaw/openclaw-9Router-13.webp" alt="Apply model" />
      <P>9Router sẽ <strong>tự sửa</strong> file config OpenClaw cho bạn ✅</P>

      <Divider />

      <H2>BƯỚC 7: TEST</H2>
      <H3>Test qua Web UI</H3>
      <Ol>
        <Li>Mở trình duyệt → truy cập <a className="link" href="http://localhost:18789" target="_blank" rel="noreferrer">http://localhost:18789</a></Li>
        <Li>Gõ <strong>&quot;hello&quot;</strong> → bot trả lời = thành công! ✅</Li>
      </Ol>
      <Img src="/docs/openclaw/openclaw-9Router-14.webp" alt="Test Model" />
      <H3>Test qua Telegram</H3>
      <Ol>
        <Li>Mở Telegram → tìm bot của bạn → gửi <strong>&quot;hello&quot;</strong></Li>
        <Li>Nếu bot không trả lời, cần pair lại:</Li>
      </Ol>
      <Code lang="bash">{`openclaw pairing list
openclaw pairing approve telegram <code>`}</Code>

      <Divider />

      <H2>Lưu ý quan trọng</H2>
      <Callout kind="important">
        <strong>9Router phải luôn chạy</strong> khi sử dụng OpenClaw, vì OpenClaw gọi model qua <Inline>localhost:20128</Inline>.
        <P>Để 9Router chạy nền, dùng <strong>PM2</strong> (trình quản lý process):</P>
      </Callout>
      <Code lang="bash">{`# Cài PM2 (chỉ cần 1 lần)
npm install -g pm2

# Chạy 9Router nền
pm2 start 9router --name 9router
pm2 save

# Tự khởi động khi restart máy/WSL
pm2 startup`}</Code>
      <P>Một số lệnh PM2 hữu ích:</P>
      <Code lang="bash">{`pm2 status          # Xem trạng thái
pm2 logs 9router    # Xem log
pm2 restart 9router # Restart
pm2 stop 9router    # Tạm dừng`}</Code>
    </DocLayout>
  );
}
