'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  code: string;
  language?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{language || 'text'}</span>
        <button onClick={copy} className="code-block-copy" title="Sao chép">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="code-block-pre">
        <code className={language ? `hljs language-${language}` : 'hljs'}>{code}</code>
      </pre>
    </div>
  );
}
