'use client';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

export type ConvItem = { id: string; title: string; updatedAt: string };

interface Props {
  conversations: ConvItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, open, onClose }: Props) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`chat-sidebar ${open ? 'chat-sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <button onClick={onNew} className="sidebar-new-btn">
            <Plus className="h-4 w-4" />
            <span>New chat</span>
          </button>
        </div>
        <div className="sidebar-list">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`sidebar-item ${c.id === activeId ? 'sidebar-item-active' : ''}`}
              onClick={() => { onSelect(c.id); onClose(); }}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="sidebar-item-title">{c.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="sidebar-item-delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="sidebar-empty">No conversations yet</p>
          )}
        </div>
      </aside>
    </>
  );
}
