'use client';
import { useState } from 'react';
import { Copy, Check, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  role: 'user' | 'assistant';
  content: string | any[];
  streaming?: boolean;
}

const FILE_REGEX = /^--- File: (.+?) ---\n([\s\S]*?)\n---$/;

function parseBlocks(content: string | any[]) {
  if (typeof content === 'string') {
    return { text: content, files: [] as { name: string; content: string }[], images: [] as any[] };
  }

  const images = content.filter((b: any) => b.type === 'image_url');
  const files: { name: string; content: string }[] = [];
  const textParts: string[] = [];

  for (const b of content) {
    if (b.type !== 'text') continue;
    const match = b.text.match(FILE_REGEX);
    if (match) {
      files.push({ name: match[1], content: match[2] });
    } else {
      textParts.push(b.text);
    }
  }

  return { text: textParts.join('\n'), files, images };
}

function FileChip({ name, content }: { name: string; content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="msg-file-chip">
      <button className="msg-file-chip-header" onClick={() => setExpanded(!expanded)}>
        <FileText className="h-4 w-4" />
        <span className="msg-file-chip-name">{name}</span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {expanded && (
        <pre className="msg-file-chip-content">{content}</pre>
      )}
    </div>
  );
}

export default function MessageBubble({ role, content, streaming }: Props) {
  const [copied, setCopied] = useState(false);
  const { text, files, images } = parseBlocks(content);

  function copyText() {
    navigator.clipboard.writeText(text);
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
              <img key={i} src={img.image_url.url} alt="Tệp đính kèm" className="msg-img-thumb" />
            ))}
          </div>
        )}
        {files.length > 0 && (
          <div className="msg-files">
            {files.map((f, i) => <FileChip key={i} name={f.name} content={f.content} />)}
          </div>
        )}
        {role === 'assistant' ? (
          <div className="msg-markdown">
            <MarkdownRenderer content={text} />
            {streaming && <span className="msg-cursor">|</span>}
          </div>
        ) : (
          text && <div className="msg-user-text">{text}</div>
        )}
        {role === 'assistant' && !streaming && text && (
          <div className="msg-actions">
            <button onClick={copyText} className="msg-copy-btn" title="Sao chép">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
