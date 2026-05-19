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

function groupByDate(conversations: ConvItem[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const week = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: ConvItem[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Older', items: [] },
  ];

  for (const c of conversations) {
    const d = new Date(c.updatedAt);
    if (d >= today) groups[0].items.push(c);
    else if (d >= yesterday) groups[1].items.push(c);
    else if (d >= week) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, open, onClose }: Props) {
  const groups = groupByDate(conversations);

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`chat-sidebar ${open ? 'chat-sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-logo">C</div>
            <span className="sidebar-brand-name">Api4Cheap</span>
          </div>
          <button onClick={onNew} className="sidebar-new-btn">
            <Plus className="h-4 w-4" />
            <span>New chat</span>
          </button>
        </div>
        <div className="sidebar-list">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="sidebar-group-label">{g.label}</div>
              {g.items.map((c) => (
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
