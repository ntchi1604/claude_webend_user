'use client';
import { useRef, useCallback } from 'react';
import { Send, Square, Paperclip, ImagePlus } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import AttachmentPreview, { type Attachment } from './AttachmentPreview';

interface Props {
  input: string;
  setInput: (v: string) => void;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  input, setInput, attachments, setAttachments,
  onSend, onStop, streaming, disabled
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const addAttachment = useCallback((att: Attachment) => {
    setAttachments((prev) => [...prev, att]);
  }, [setAttachments]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, [setAttachments]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!streaming) onSend();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) processImage(file);
        break;
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith('image/')) processImage(file);
      else processFile(file);
    }
  }

  function processImage(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert('File quá lớn (tối đa 10MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      addAttachment({
        id: crypto.randomUUID(),
        type: 'image',
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  }

  function processFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert('File quá lớn (tối đa 10MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      addAttachment({
        id: crypto.randomUUID(),
        type: 'file',
        name: file.name,
        size: file.size,
        textContent: reader.result as string
      });
    };
    reader.readAsText(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) processFile(file);
    e.target.value = '';
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) processImage(file);
    e.target.value = '';
  }

  return (
    <div className="chat-input-area">
      <div
        className="chat-input-box"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />
        <TextareaAutosize
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Nhập tin nhắn..."
          className="chat-textarea"
          maxRows={6}
          disabled={streaming || disabled}
        />
        <div className="chat-input-bottom">
          <div className="chat-input-actions">
            <button onClick={() => fileRef.current?.click()} className="chat-input-btn" title="Đính kèm file">
              <Paperclip className="h-4 w-4" />
            </button>
            <button onClick={() => imgRef.current?.click()} className="chat-input-btn" title="Thêm ảnh">
              <ImagePlus className="h-4 w-4" />
            </button>
          </div>
          <div className="chat-input-spacer" />
          {streaming ? (
            <button onClick={onStop} className="chat-send-btn">
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={(!input.trim() && attachments.length === 0) || disabled}
              className="chat-send-btn"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" hidden multiple accept=".txt,.md,.py,.js,.ts,.json,.csv,.html,.css,.xml,.yaml,.yml,.toml,.rs,.go,.java,.c,.cpp,.h" onChange={handleFileSelect} />
      <input ref={imgRef} type="file" hidden multiple accept="image/*" onChange={handleImageSelect} />
    </div>
  );
}
