'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  role: 'user' | 'assistant';
  content: string | any[];
  streaming?: boolean;
}

export default function MessageBubble({ role, content, streaming }: Props) {
  const [copied, setCopied] = useState(false);

  const textContent = typeof content === 'string'
    ? content
    : content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');

  const images = typeof content !== 'string'
    ? content.filter((b: any) => b.type === 'image_url')
    : [];

  function copyText() {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`msg-bubble msg-${role}`}>
      <div className="msg-avatar">
        {role === 'assistant' ? (
          <span className="msg-avatar-ai">C</span>
        ) : (
          <span className="msg-avatar-user">U</span>
        )}
      </div>
      <div className="msg-content">
        {images.length > 0 && (
          <div className="msg-images">
            {images.map((img: any, i: number) => (
              <img key={i} src={img.image_url.url} alt="attachment" className="msg-img-thumb" />
            ))}
          </div>
        )}
        {role === 'assistant' ? (
          <div className="msg-markdown">
            <MarkdownRenderer content={textContent} />
            {streaming && <span className="msg-cursor">|</span>}
          </div>
        ) : (
          <div className="msg-user-text">{textContent}</div>
        )}
        {role === 'assistant' && !streaming && textContent && (
          <div className="msg-actions">
            <button onClick={copyText} className="msg-copy-btn" title="Copy">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
