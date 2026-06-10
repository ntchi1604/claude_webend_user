import './globals.css';
import 'highlight.js/styles/github-dark.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Api4Cheap - Cá»•ng cho Claude Code vÃ  Codex CLI',
  description: 'Cá»•ng Api4Cheap cho Claude Code vÃ  Codex CLI vá»›i base URL tá»± nháº­n diá»‡n theo domain hiá»‡n táº¡i.',
  icons: {
    icon: [{ url: '/api4cheap-logo.svg', type: 'image/svg+xml' }],
    shortcut: ['/api4cheap-logo.svg'],
    apple: [{ url: '/api4cheap-logo.svg' }],
  },
};

const themeScript = `(()=>{try{const t=localStorage.getItem('theme');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Source+Serif+4:wght@400;500&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
