import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';

export const metadata = { title: 'Codex CLI - Api4Cheap' };

export default function Page() {
  return (
    <DocLayout
      title="Codex CLI Setup Guide"
      description="Cai dat Codex CLI chinh thuc va cau hinh provider Api4Cheap theo Codex Setup Guide."
    >
      <H2>Tong quan</H2>
      <P>
        <strong>Codex CLI</strong> la AI coding agent chinh thuc cua OpenAI. Cau hinh ben duoi dung package
        <Inline>@openai/codex</Inline>, xac thuc bang API key va route qua endpoint
        <Inline>https://lccaptcha.io.vn</Inline> voi Responses API.
      </P>

      <Callout kind="important">
        Quick Setup chi backup va ghi lai <Inline>auth.json</Inline> cung <Inline>config.toml</Inline>. Khong xoa hoac di chuyen toan bo
        <Inline>~/.codex</Inline>, vi Codex co the dang giu file log SQLite trong thu muc nay.
      </Callout>

      <Divider />

      <H2>Yeu cau</H2>
      <Ul>
        <Li>Windows 10 build 17763 / version 1809 tro len, macOS hoac Linux.</Li>
        <Li>Node.js va npm neu cai qua npm; macOS co the cai bang Homebrew.</Li>
        <Li>API key tu Api4Cheap dashboard.</Li>
      </Ul>

      <Divider />

      <H2>Buoc 1: Cai Codex CLI</H2>
      <P>Chay mot trong hai lenh sau:</P>
      <Code lang="bash">{`npm install -g @openai/codex
# or
brew install codex`}</Code>
      <P>Kiem tra cai dat:</P>
      <Code lang="bash">{`codex -V`}</Code>

      <Divider />

      <H2>Buoc 2: Lay API key</H2>
      <P>Mo trang API Keys tren dashboard Api4Cheap, tao key moi va copy secret.</P>
      <Callout kind="warn">Treat your key like a password. Khong chia se key trong log, chat cong khai hoac repo.</Callout>

      <Divider />

      <H2>Buoc 3: Quick Setup</H2>
      <Ol>
        <Li>Vao <Link className="link" href="/dashboard/docs">Quick Setup</Link>.</Li>
        <Li>Chon tab <strong>Codex CLI</strong>.</Li>
        <Li>Paste API key day du vao o <strong>API Key</strong>.</Li>
        <Li>Chon he dieu hanh.</Li>
        <Li>Copy lenh cai dat va chay trong PowerShell hoac terminal.</Li>
      </Ol>
      <P>Script tu dong cai <Inline>@openai/codex</Inline> neu chua co, backup hai file cau hinh cu neu ton tai, roi tao:</P>
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

      <H2>Cau hinh thu cong</H2>
      <Ol>
        <Li>Tao thu muc <Inline>~/.codex</Inline> neu chua ton tai.</Li>
        <Li>Tao <Inline>auth.json</Inline> voi noi dung JSON o tren.</Li>
        <Li>Tao <Inline>config.toml</Inline> voi noi dung TOML o tren.</Li>
        <Li>Restart terminal.</Li>
      </Ol>

      <Divider />

      <H2>Bat dau dung</H2>
      <Code lang="bash">{`cd your-project-folder
codex`}</Code>
      <P>VS Code extension chinh thuc cua Codex van dung duoc voi cau hinh nay.</P>
    </DocLayout>
  );
}
