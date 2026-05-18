'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, RotateCcw } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('claude-opus-4-7');
  const [models, setModels] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('chat_api_key');
    if (saved) setApiKey(saved);
    const savedModel = localStorage.getItem('chat_model');
    if (savedModel) setModel(savedModel);
    fetchModels(saved || '');
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function fetchModels(key: string) {
    if (!key) return;
    try {
      const r = await fetch('/v1/models', { headers: { authorization: `Bearer ${key}` } });
      const d = await r.json();
      if (d.data) {
        const ids: string[] = d.data.map((m: any) => m.id);
        setModels(ids);
        setModel((prev) => {
          if (ids.length === 0) return prev;
          if (ids.includes(prev)) return prev;
          const fallback = ids[0];
          localStorage.setItem('chat_model', fallback);
          return fallback;
        });
      }
    } catch {}
  }

  function saveKey(k: string) { setApiKey(k); localStorage.setItem('chat_api_key', k); fetchModels(k); }
  function saveModel(m: string) { setModel(m); localStorage.setItem('chat_model', m); }

  const send = useCallback(async () => {
    if (!input.trim() || !apiKey || streaming) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setStreaming(true);
    setMessages([...newMsgs, { role: 'assistant', content: '' }]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const r = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: newMsgs.map((m) => ({ role: m.role, content: m.content })), stream: true }),
        signal: ctrl.signal
      });

      if (!r.ok || !r.body) {
        const text = await r.text();
        let errMsg = text;
        try { errMsg = JSON.parse(text)?.error?.message || text; } catch {}
        setMessages([...newMsgs, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
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
            if (j?.error) full += `\n⚠️ ${j.error.message}`;
            else { const d = j?.choices?.[0]?.delta?.content; if (typeof d === 'string') full += d; }
          } catch {}
        }
        setMessages([...newMsgs, { role: 'assistant', content: full }]);
      }
      setMessages([...newMsgs, { role: 'assistant', content: full }]);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setMessages([...newMsgs, { role: 'assistant', content: `⚠️ ${e?.message || 'Error'}` }]);
    } finally { setStreaming(false); abortRef.current = null; }
  }, [input, apiKey, model, messages, streaming]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="cc-container">
      {/* Header */}
      <div className="cc-header">
        <div className="flex items-center gap-3">
          <span className="cc-logo">C</span>
          <select value={model} onChange={(e) => saveModel(e.target.value)} className="cc-select">
            {models.length > 0 ? models.map((m) => <option key={m} value={m}>{m}</option>) : <option value={model}>{model}</option>}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="password" placeholder="sk-cw-..." value={apiKey} onChange={(e) => saveKey(e.target.value)} className="cc-key-input" />
          <button onClick={() => setMessages([])} className="cc-icon-btn" title="Clear"><RotateCcw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="cc-messages">
        {messages.length === 0 && (
          <div className="cc-empty">
            <span className="cc-empty-logo">C</span>
            <p className="body-sm text-[var(--stone-600)] mt-3">Nhập tin nhắn để bắt đầu</p>
            <p className="caption mt-1">{model}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`cc-msg ${m.role === 'user' ? 'cc-msg-user' : 'cc-msg-ai'}`}>
            <div className="cc-msg-indicator">{m.role === 'user' ? '❯' : 'C'}</div>
            <pre className="cc-msg-text">{m.content}{streaming && i === messages.length - 1 && m.role === 'assistant' ? '▊' : ''}</pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="cc-input-area">
        <div className="cc-input-box">
          <span className="cc-prompt">❯</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="cc-textarea"
            rows={1}
            disabled={streaming}
          />
          {streaming ? (
            <button onClick={() => abortRef.current?.abort()} className="cc-send"><Square className="h-4 w-4" /></button>
          ) : (
            <button onClick={send} disabled={!input.trim() || !apiKey} className="cc-send"><Send className="h-4 w-4" /></button>
          )}
        </div>
        <div className="cc-footer">
          <span>{model}</span>
          <span>·</span>
          <span>{messages.filter((m) => m.role === 'user').length} turns</span>
        </div>
      </div>

      <style>{`
        .cc-container{display:flex;flex-direction:column;height:100vh;background:#141413;color:#FAF9F5;font-family:var(--font-mono)}
        .cc-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #30302E;background:#141413}
        .cc-logo{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;background:#C46849;color:#fff;font-family:var(--font-serif);font-size:14px;font-weight:500}
        .cc-select{background:#30302E;border:1px solid #5E5D59;border-radius:6px;padding:5px 10px;font-size:13px;color:#FAF9F5;outline:none;font-family:var(--font-mono)}
        .cc-key-input{background:#30302E;border:1px solid #5E5D59;border-radius:6px;padding:5px 10px;font-size:12px;color:#FAF9F5;width:180px;outline:none;font-family:var(--font-mono)}
        .cc-key-input:focus{border-color:#6A9BCC}
        .cc-icon-btn{background:#30302E;border:1px solid #5E5D59;border-radius:6px;padding:7px;color:#CBCADB;cursor:pointer}
        .cc-icon-btn:hover{color:#FAF9F5;border-color:#C46849}
        .cc-messages{flex:1;overflow-y:auto;padding:20px 16px}
        .cc-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%}
        .cc-empty-logo{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:#C46849;color:#fff;font-family:var(--font-serif);font-size:24px;font-weight:500}
        .cc-msg{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #30302E}
        .cc-msg:last-child{border-bottom:none}
        .cc-msg-indicator{min-width:22px;font-size:14px;padding-top:2px;font-weight:500}
        .cc-msg-user .cc-msg-indicator{color:#C46849}
        .cc-msg-ai .cc-msg-indicator{color:#6A9BCC;font-family:var(--font-serif)}
        .cc-msg-text{white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:20px;margin:0;font-family:var(--font-mono);flex:1}
        .cc-msg-user .cc-msg-text{color:#E3DACC}
        .cc-msg-ai .cc-msg-text{color:#FAF9F5}
        .cc-input-area{padding:12px 16px;border-top:1px solid #30302E;background:#141413}
        .cc-input-box{display:flex;align-items:center;gap:10px;background:#30302E;border:1px solid #5E5D59;border-radius:8px;padding:10px 14px}
        .cc-input-box:focus-within{border-color:#C46849;box-shadow:0 0 0 2px rgba(196,104,73,0.15)}
        .cc-prompt{color:#C46849;font-size:14px;font-weight:bold}
        .cc-textarea{flex:1;background:transparent;border:none;outline:none;color:#FAF9F5;font-size:13px;font-family:var(--font-mono);resize:none;line-height:20px;max-height:120px}
        .cc-textarea::placeholder{color:#5E5D59}
        .cc-send{background:#C46849;border:none;border-radius:6px;padding:7px 12px;color:white;cursor:pointer;display:flex;align-items:center}
        .cc-send:hover{background:#B85A3A}
        .cc-send:disabled{opacity:0.4;cursor:not-allowed}
        .cc-footer{display:flex;gap:6px;padding:6px 4px 0;font-size:11px;color:#5E5D59}
        .cc-messages::-webkit-scrollbar{width:5px}
        .cc-messages::-webkit-scrollbar-track{background:transparent}
        .cc-messages::-webkit-scrollbar-thumb{background:#30302E;border-radius:3px}
      `}</style>
    </div>
  );
}
