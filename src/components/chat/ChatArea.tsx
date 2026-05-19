'use client';
import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';

export type ChatMsg = { role: 'user' | 'assistant'; content: string | any[] };

interface Props {
  messages: ChatMsg[];
  streaming: boolean;
  model: string;
  onSuggestion?: (text: string) => void;
}

export default function ChatArea({ messages, streaming, model, onSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return <EmptyState model={model} onSuggestion={onSuggestion} />;

  return (
    <div className="chat-area">
      <div className="chat-messages-inner">
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            role={m.role}
            content={m.content}
            streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
