import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';
import { getPublicOrigin } from '@/lib/public-url';

export const metadata = { title: 'Codex CLI - Api4Cheap' };

export default function Page() {
  const publicOrigin = getPublicOrigin() || 'https://your-domain';
  const codexBaseUrl = `${publicOrigin}/v1`;

  return (
    <DocLayout
      title="HÆ°á»›ng dáº«n cÃ i Ä‘áº·t Codex CLI"
      description="CÃ i Ä‘áº·t Codex CLI chÃ­nh thá»©c vÃ  cáº¥u hÃ¬nh provider Api4Cheap theo hÆ°á»›ng dáº«n cÃ i Ä‘áº·t."
    >
      <H2>Tá»•ng quan</H2>
      <P>
        <strong>Codex CLI</strong> lÃ  AI coding agent chÃ­nh thá»©c cá»§a OpenAI. Cáº¥u hÃ¬nh bÃªn dÆ°á»›i dÃ¹ng package
        <Inline>@openai/codex</Inline>, xÃ¡c thá»±c báº±ng API key vÃ  route qua endpoint
        <Inline>{publicOrigin}</Inline> vá»›i Responses API.
      </P>

      <Callout kind="important">
        CÃ i Ä‘áº·t nhanh chá»‰ backup vÃ  ghi láº¡i <Inline>auth.json</Inline> cÃ¹ng <Inline>config.toml</Inline>. KhÃ´ng xoÃ¡ hoáº·c di chuyá»ƒn toÃ n bá»™
        <Inline>~/.codex</Inline>, vÃ¬ Codex cÃ³ thá»ƒ Ä‘ang giá»¯ file log SQLite trong thÆ° má»¥c nÃ y.
      </Callout>

      <Divider />

      <H2>YÃªu cáº§u</H2>
      <Ul>
        <Li>Windows 10 build 17763 / version 1809 trá»Ÿ lÃªn, macOS hoáº·c Linux.</Li>
        <Li>Node.js vÃ  npm náº¿u cÃ i qua npm; macOS cÃ³ thá»ƒ cÃ i báº±ng Homebrew.</Li>
        <Li>API key tá»« dashboard Api4Cheap.</Li>
      </Ul>

      <Divider />

      <H2>BÆ°á»›c 1: CÃ i Codex CLI</H2>
      <P>Cháº¡y má»™t trong hai lá»‡nh sau:</P>
      <Code lang="bash">{`npm install -g @openai/codex
# hoáº·c
brew install codex`}</Code>
      <P>Kiá»ƒm tra cÃ i Ä‘áº·t:</P>
      <Code lang="bash">{`codex -V`}</Code>

      <Divider />

      <H2>BÆ°á»›c 2: Láº¥y API key</H2>
      <P>Má»Ÿ trang API key trÃªn dashboard Api4Cheap, táº¡o key má»›i vÃ  sao chÃ©p secret.</P>
      <Callout kind="warn">HÃ£y giá»¯ key nhÆ° máº­t kháº©u. KhÃ´ng chia sáº» key trong log, chat cÃ´ng khai hoáº·c repo.</Callout>

      <Divider />

      <H2>BÆ°á»›c 3: CÃ i Ä‘áº·t nhanh</H2>
      <Ol>
        <Li>VÃ o <Link className="link" href="/dashboard/docs">CÃ i Ä‘áº·t nhanh</Link>.</Li>
        <Li>Chá»n tab <strong>Codex CLI</strong>.</Li>
        <Li>DÃ¡n API key Ä‘áº§y Ä‘á»§ vÃ o Ã´ <strong>API key</strong>.</Li>
        <Li>Chá»n há»‡ Ä‘iá»u hÃ nh.</Li>
        <Li>Sao chÃ©p lá»‡nh cÃ i Ä‘áº·t vÃ  cháº¡y trong PowerShell hoáº·c terminal.</Li>
      </Ol>
      <P>Script tá»± Ä‘á»™ng cÃ i <Inline>@openai/codex</Inline> náº¿u chÆ°a cÃ³, backup hai file cáº¥u hÃ¬nh cÅ© náº¿u tá»“n táº¡i, rá»“i táº¡o:</P>
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
base_url = "${codexBaseUrl}"
wire_api = "responses"`}</Code>

      <Divider />

      <H2>Cáº¥u hÃ¬nh thá»§ cÃ´ng</H2>
      <Ol>
        <Li>Táº¡o thÆ° má»¥c <Inline>~/.codex</Inline> náº¿u chÆ°a tá»“n táº¡i.</Li>
        <Li>Táº¡o <Inline>auth.json</Inline> vá»›i ná»™i dung JSON á»Ÿ trÃªn.</Li>
        <Li>Táº¡o <Inline>config.toml</Inline> vá»›i ná»™i dung TOML á»Ÿ trÃªn.</Li>
        <Li>Khá»Ÿi Ä‘á»™ng láº¡i terminal.</Li>
      </Ol>

      <Divider />

      <H2>Báº¯t Ä‘áº§u dÃ¹ng</H2>
      <Code lang="bash">{`cd thu-muc-du-an-cua-ban
codex`}</Code>
      <P>Extension VS Code chÃ­nh thá»©c cá»§a Codex váº«n dÃ¹ng Ä‘Æ°á»£c vá»›i cáº¥u hÃ¬nh nÃ y.</P>
    </DocLayout>
  );
}
