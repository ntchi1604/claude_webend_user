import { DocLayout, H2, P, Code, Inline, Callout, Ol, Li, Ul, Divider } from '@/components/doc-elements';
import Link from 'next/link';
import { getPublicOrigin } from '@/lib/public-url';

export const metadata = { title: 'Claude Code â€” Api4Cheap' };

export default function Page() {
  const publicOrigin = getPublicOrigin() || 'https://your-domain';

  return (
    <DocLayout
      title="HÆ°á»›ng dáº«n cÃ i Ä‘áº·t Claude Code"
      description="CÃ i Ä‘áº·t Claude Code client vÃ  cáº¥u hÃ¬nh endpoint Api4Cheap theo hÆ°á»›ng dáº«n cÃ i Ä‘áº·t."
    >
      <H2>Tá»•ng quan</H2>
      <P>
        <strong>Claude Code</strong> lÃ  coding client cháº¡y trong terminal. Cáº¥u hÃ¬nh bÃªn dÆ°á»›i dÃ¹ng package
        <Inline>@anthropic-ai/claude-code</Inline>, xÃ¡c thá»±c báº±ng API key vÃ  route qua
        <Inline>{publicOrigin}</Inline>.
      </P>

      <Callout kind="tip">
        TrÃªn Windows nÃªn cháº¡y Claude Code trong Git Bash Ä‘á»ƒ viá»‡c xá»­ lÃ½ path vÃ  quoting á»•n Ä‘á»‹nh hÆ¡n CMD/PowerShell.
      </Callout>

      <Divider />

      <H2>YÃªu cáº§u</H2>
      <Ul>
        <Li>Windows 10 trá»Ÿ lÃªn, macOS hoáº·c Linux.</Li>
        <Li>Node.js <strong>18+</strong>.</Li>
        <Li>API key tá»« Api4Cheap dashboard.</Li>
      </Ul>

      <Divider />

      <H2>BÆ°á»›c 1: CÃ i Git Bash vÃ  Node.js</H2>
      <P>Windows nÃªn cÃ i Git for Windows vá»›i tÃ¹y chá»n máº·c Ä‘á»‹nh. Kiá»ƒm tra Node.js:</P>
      <Code lang="bash">{`node --version`}</Code>
      <P>Náº¿u version nhá» hÆ¡n 18.0.0, cÃ i Node.js LTS rá»“i má»Ÿ láº¡i terminal.</P>

      <Divider />

      <H2>BÆ°á»›c 2: CÃ i Claude Code</H2>
      <Code lang="bash">{`npm install -g @anthropic-ai/claude-code`}</Code>
      <P>Sau khi cÃ i, Ä‘Ã³ng vÃ  má»Ÿ láº¡i terminal Ä‘á»ƒ PATH nháº­n lá»‡nh <Inline>claude</Inline>.</P>

      <Divider />

      <H2>BÆ°á»›c 3: Láº¥y API key</H2>
      <P>Má»Ÿ trang API key trong dashboard Api4Cheap, táº¡o key má»›i vÃ  sao chÃ©p secret.</P>
      <Callout kind="warn">API key chá»‰ nÃªn lÆ°u á»Ÿ mÃ¡y cá»§a báº¡n. Báº¥t ká»³ ai cÃ³ key Ä‘á»u cÃ³ thá»ƒ dÃ¹ng credit cá»§a báº¡n.</Callout>

      <Divider />

      <H2>BÆ°á»›c 4: CÃ i Ä‘áº·t nhanh</H2>
      <Ol>
        <Li>VÃ o <Link className="link" href="/dashboard/docs">CÃ i Ä‘áº·t nhanh</Link>.</Li>
        <Li>Chá»n tab <strong>Claude Code</strong>.</Li>
        <Li>DÃ¡n API key Ä‘áº§y Ä‘á»§ vÃ o Ã´ <strong>API key</strong>.</Li>
        <Li>Chá»n há»‡ Ä‘iá»u hÃ nh.</Li>
        <Li>Sao chÃ©p lá»‡nh cÃ i Ä‘áº·t vÃ  cháº¡y trong PowerShell, Git Bash hoáº·c terminal.</Li>
      </Ol>
      <P>Script sáº½ táº¡o <Inline>~/.claude/settings.json</Inline> theo máº«u sau:</P>
      <Code lang="json">{`{
  "model": "opus",
  "env": {
    "ANTHROPIC_API_KEY": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "${publicOrigin}",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-7",
    "ANTHROPIC_DISABLE_INTERLEAVED_STREAMING": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "effortLevel": "medium"
}`}</Code>

      <Divider />

      <H2>Cáº¥u hÃ¬nh thá»§ cÃ´ng</H2>
      <Ol>
        <Li>Náº¿u <Inline>~/.claude</Inline> chÆ°a tá»“n táº¡i, cháº¡y <Inline>claude</Inline> má»™t láº§n Ä‘á»ƒ client táº¡o thÆ° má»¥c.</Li>
        <Li>Táº¡o hoáº·c thay tháº¿ <Inline>~/.claude/settings.json</Inline> báº±ng JSON á»Ÿ trÃªn.</Li>
        <Li>Thay <Inline>YOUR_API_KEY</Inline> báº±ng secret cá»§a báº¡n.</Li>
        <Li>Khá»Ÿi Ä‘á»™ng láº¡i terminal.</Li>
      </Ol>

      <Divider />

      <H2>Khá»Ÿi cháº¡y vÃ  kiá»ƒm tra</H2>
      <Code lang="bash">{`claude`}</Code>
      <P>Trong Claude Code, cÃ³ thá»ƒ gÃµ <Inline>/status</Inline> Ä‘á»ƒ kiá»ƒm tra base URL vÃ  thÃ´ng tin auth.</P>

      <Divider />

      <H2>FAQ ngáº¯n</H2>
      <Ul>
        <Li>Cáº­p nháº­t: cháº¡y láº¡i <Inline>npm install -g @anthropic-ai/claude-code</Inline>.</Li>
        <Li>Gá»¡ client: <Inline>npm uninstall -g @anthropic-ai/claude-code</Inline>.</Li>
        <Li>Náº¿u npm lá»—i máº¡ng, thá»­ registry mirror: <Inline>npm install -g @anthropic-ai/claude-code --registry https://registry.npmmirror.com</Inline>.</Li>
      </Ul>
    </DocLayout>
  );
}
