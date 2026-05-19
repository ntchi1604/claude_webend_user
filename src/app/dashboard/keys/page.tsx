'use client';
import { useState, useEffect } from 'react';
import { Copy, Trash2, Plus } from 'lucide-react';

type ApiKey = { id: string; keyPrefix: string; name: string | null; active: boolean; lastUsedAt: string | null; createdAt: string };

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchKeys(); }, []);

  async function fetchKeys() {
    const r = await fetch('/api/keys');
    if (r.ok) { const d = await r.json(); setKeys(d.keys || d); }
  }

  async function createKey() {
    setLoading(true);
    const r = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name || undefined })
    });
    if (r.ok) {
      const d = await r.json();
      setNewKey(d.key);
      setName('');
      fetchKeys();
    }
    setLoading(false);
  }

  async function deleteKey(id: string) {
    if (!confirm('Xoá key này?')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    fetchKeys();
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="heading-1">API Keys</h1>
        <p className="body-sm text-[var(--stone-600)] mt-1">Tạo và quản lý API keys. Key chỉ hiện 1 lần khi tạo.</p>
      </div>

      {/* Create */}
      <div className="card">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="form-label">Tên key (tuỳ chọn)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="My Claude Code key" />
          </div>
          <button onClick={createKey} disabled={loading} className="btn-cta whitespace-nowrap">
            <Plus className="h-4 w-4" /> Tạo key
          </button>
        </div>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div className="card-code flex items-center justify-between gap-3">
          <code className="text-[13px] break-all">{newKey}</code>
          <button onClick={() => copyKey(newKey)} className="cc-icon-btn" style={{ background: '#30302E', border: '1px solid #5E5D59', borderRadius: '6px', padding: '6px', color: '#CBCADB', cursor: 'pointer' }}>
            <Copy className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="card flex items-center justify-between py-3 px-4">
            <div>
              <div className="label">{k.name || k.keyPrefix + '...'}</div>
              <div className="caption">{k.keyPrefix}... · Tạo {new Date(k.createdAt).toLocaleDateString('vi')}</div>
            </div>
            <div className="flex items-center gap-2">
              {k.active ? <span className="badge-success">Active</span> : <span className="badge-error">Disabled</span>}
              <button onClick={() => deleteKey(k.id)} className="btn-ghost" style={{ padding: '6px', color: 'var(--error)' }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {keys.length === 0 && <p className="caption text-center py-8">Chưa có key nào. Tạo key đầu tiên ở trên.</p>}
      </div>
    </div>
  );
}
