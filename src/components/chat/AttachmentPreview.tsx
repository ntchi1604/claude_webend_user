'use client';
import { X, FileText, Image as ImageIcon } from 'lucide-react';

export type Attachment = {
  id: string;
  type: 'image' | 'file';
  name: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
};

interface Props {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export default function AttachmentPreview({ attachments, onRemove }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="attachment-bar">
      {attachments.map((a) => (
        <div key={a.id} className="attachment-item">
          {a.type === 'image' && a.dataUrl ? (
            <img src={a.dataUrl} alt={a.name} className="attachment-thumb" />
          ) : (
            <div className="attachment-file-icon">
              <FileText className="h-4 w-4" />
            </div>
          )}
          <span className="attachment-name">{a.name}</span>
          <button onClick={() => onRemove(a.id)} className="attachment-remove">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
