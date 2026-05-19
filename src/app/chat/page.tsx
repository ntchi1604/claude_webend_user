'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import ChatSidebar, { type ConvItem } from '@/components/chat/ChatSidebar';
import ChatArea, { type ChatMsg } from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import ModelSelector from '@/components/chat/ModelSelector';
import { type Attachment } from '@/components/chat/AttachmentPreview';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [model, setModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchModels();
    fetchConversations();
    const saved = localStorage.getItem('chat_model');
    if (saved) setModel(saved);
  }, []);

  async function fetchModels() {
    try {
      const r = await fetch('/v1/models', { credentials: 'include' });
      const d = await r.json();
      if (d.data) {
        const ids: string[] = d.data.map((m: any) => m.id);
        setModels(ids);
        setModel((prev) => {
          if (prev && ids.includes(prev)) return prev;
          const fallback = ids[0] || prev;
          localStorage.setItem('chat_model', fallback);
          return fallback;
        });
      }
    } catch {}
  }

  async function fetchConversations() {
    try {
      const r = await fetch('/api/conversations', { credentials: 'include' });
      if (r.ok) setConversations(await r.json());
    } catch {}
  }


  async function loadConversation(id: string) {
    try {
      const r = await fetch(`/api/conversations/${id}`, { credentials: 'include' });
      if (!r.ok) return;
      const data = await r.json();
      setActiveConvId(id);
      const msgs: ChatMsg[] = data.messages.map((m: any) => {
        let content: string | any[];
        try { content = JSON.parse(m.content); } catch { content = m.content; }
        return { role: m.role, content };
      });
      setMessages(msgs);
      if (data.model) {
        setModel(data.model);
        localStorage.setItem('chat_model', data.model);
      }
    } catch {}
  }

  function handleNewChat() {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
    setAttachments([]);
  }

  async function handleDeleteConv(id: string) {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE', credentials: 'include' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) handleNewChat();
  }

  function handleModelChange(m: string) {
    setModel(m);
    localStorage.setItem('chat_model', m);
  }

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (streaming) return;

    let userContent: string | any[];
    const contentBlocks: any[] = [];

    for (const att of attachments) {
      if (att.type === 'image' && att.dataUrl) {
        contentBlocks.push({ type: 'image_url', image_url: { url: att.dataUrl } });
      } else if (att.type === 'file' && att.textContent) {
        contentBlocks.push({ type: 'text', text: `--- File: ${att.name} ---\n${att.textContent}\n---` });
      }
    }

    if (contentBlocks.length > 0) {
      if (text) contentBlocks.push({ type: 'text', text });
      userContent = contentBlocks;
    } else {
      userContent = text;
    }

    const userMsg: ChatMsg = { role: 'user', content: userContent };
    const newMsgs = [...messages, userMsg];
    setMessages([...newMsgs, { role: 'assistant', content: '' }]);
    setInput('');
    setAttachments([]);
    setStreaming(true);

    let convId = activeConvId;
    if (!convId) {
      try {
        const r = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: text.slice(0, 50) || 'New conversation', model })
        });
        const conv = await r.json();
        convId = conv.id;
        setActiveConvId(convId);
        setConversations((prev) => [{ id: conv.id, title: conv.title, updatedAt: conv.updatedAt || new Date().toISOString() }, ...prev]);
      } catch {}
    }

    if (convId) {
      fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'user', content: userContent })
      }).catch(() => {});
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const apiMessages = newMsgs.map((m) => ({ role: m.role, content: m.content }));

    try {
      const r = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model, messages: apiMessages, stream: true }),
        signal: ctrl.signal
      });

      if (!r.ok || !r.body) {
        const errText = await r.text();
        let errMsg = errText;
        try { errMsg = JSON.parse(errText)?.error?.message || errText; } catch {}
        setMessages([...newMsgs, { role: 'assistant', content: `Error: ${errMsg}` }]);
        setStreaming(false);
        return;
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = '', full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const evt of parts) {
          const line = evt.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            if (j?.error) full += `\nError: ${j.error.message}`;
            else { const d = j?.choices?.[0]?.delta?.content; if (typeof d === 'string') full += d; }
          } catch {}
        }
        setMessages([...newMsgs, { role: 'assistant', content: full }]);
      }
      setMessages([...newMsgs, { role: 'assistant', content: full }]);

      if (convId && full) {
        fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role: 'assistant', content: full })
        }).catch(() => {});
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setMessages([...newMsgs, { role: 'assistant', content: `Error: ${e?.message || 'Unknown error'}` }]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, attachments, model, messages, streaming, activeConvId]);

  return (
    <div className="chat-layout">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={loadConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConv}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="chat-main">
        <header className="chat-header">
          <button onClick={() => setSidebarOpen(true)} className="chat-menu-btn">
            <Menu className="h-5 w-5" />
          </button>
          <ModelSelector models={models} selected={model} onChange={handleModelChange} />
        </header>
        <ChatArea messages={messages} streaming={streaming} model={model} onSuggestion={(text) => { setInput(text); }} />
        <ChatInput
          input={input}
          setInput={setInput}
          attachments={attachments}
          setAttachments={setAttachments}
          onSend={send}
          onStop={() => abortRef.current?.abort()}
          streaming={streaming}
        />
      </div>
    </div>
  );
}
