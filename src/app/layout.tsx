import './globals.css';
import 'highlight.js/styles/github-dark.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import { Toaster } from 'sonner';

const fontSans = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Source_Serif_4({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-serif',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Api4Cheap - Cổng cho Claude Code và Codex CLI',
  description: 'Cổng Api4Cheap cho Claude Code và Codex CLI với base URL tự nhận diện theo domain hiện tại.',
  icons: {
    icon: [{ url: '/api4cheap-logo.svg', type: 'image/svg+xml' }],
    shortcut: ['/api4cheap-logo.svg'],
    apple: [{ url: '/api4cheap-logo.svg' }],
  },
};

const themeScript = `(()=>{try{const t=localStorage.getItem('theme');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
