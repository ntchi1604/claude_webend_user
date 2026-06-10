'use client';
import { Children } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from './CodeBlock';

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeStr = Children.toArray(children)
            .map((child) => (typeof child === 'string' ? child : ''))
            .join('')
            .replace(/\n$/, '');
          if (match) {
            return <CodeBlock code={codeStr} language={match[1]} />;
          }
          return <code className="inline-code" {...props}>{children}</code>;
        },
        pre({ children }) {
          return <>{children}</>;
        },
        a({ href, children }) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="md-link">{children}</a>;
        },
        table({ children }) {
          return <div className="md-table-wrap"><table className="md-table">{children}</table></div>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
