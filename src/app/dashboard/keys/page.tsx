'use client';
import { useState, useEffect } from 'react';
import { Copy, KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';

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
    if (!confirm('Xóa key này?')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    fetchKeys();
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(textarea);
    });
  }

  return (
    <div className="app-page animate-fade-in">
      <div className="app-page-header">
        <div>
          <p className="dashboard-eyebrow">Credentials</p>
          <h1 className="heading-1">API key</h1>
          <p className="body-sm text-[var(--stone-600)] mt-1">Tạo và quản lý API key. Secret chỉ hiện một lần khi tạo.</p>
        </div>
        <div className="app-header-stat">
          <KeyRound className="h-4 w-4" />
          <span>{keys.length} key</span>
        </div>
      </div>

      <div className="keys-layout">
        <section className="keys-main">
          <div className="card keys-create-card">
            <div>
              <h2 className="heading-5">Tạo key mới</h2>
              <p className="caption mt-1">Đặt tên theo thiết bị hoặc workflow để dễ thu hồi sau này.</p>
            </div>
            <div className="keys-create-form">
              <div className="flex-1 min-w-0">
                <label className="form-label">Tên key (tuỳ chọn)</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Key Claude Code của tôi" />
              </div>
              <button onClick={createKey} disabled={loading} className="btn-cta whitespace-nowrap">
                <Plus className="h-4 w-4" /> Tạo key
              </button>
            </div>
          </div>

          {newKey && (
            <div className="card-code keys-new-key">
              <code>{newKey}</code>
              <button onClick={() => copyKey(newKey)} className="cc-icon-btn" style={{ background: '#30302E', border: '1px solid #5E5D59', borderRadius: '6px', padding: '6px', color: '#CBCADB', cursor: 'pointer' }}>
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="keys-list">
            {keys.map((k) => (
              <div key={k.id} className="card keys-row">
                <div className="min-w-0">
                  <div className="label">{k.name || k.keyPrefix + '...'}</div>
                  <div className="caption">{k.keyPrefix}... · Tạo {new Date(k.createdAt).toLocaleDateString('vi')}</div>
                </div>
                <div className="keys-row-actions">
                  {k.active ? <span className="badge-success">Đang hoạt động</span> : <span className="badge-error">Đã tắt</span>}
                  <button onClick={() => deleteKey(k.id)} className="btn-ghost" style={{ padding: '6px', color: 'var(--error)' }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {keys.length === 0 && <p className="caption text-center py-8">Chưa có key nào. Tạo key đầu tiên ở trên.</p>}
          </div>
        </section>

        <aside className="keys-side card">
          <div className="dashboard-stat-icon dashboard-stat-green"><ShieldCheck className="h-4 w-4" /></div>
          <h2 className="heading-5">Lưu ý bảo mật</h2>
          <p className="body-sm text-[var(--stone-600)]">Không chia sẻ API key trong chat, log công khai hoặc repository. Nếu nghi ngờ lộ key, xoá key cũ và tạo key mới.</p>
          <div className="keys-side-rule">
            <span>Secret chỉ hiện một lần</span>
            <strong>Khi vừa tạo</strong>
          </div>
          <div className="keys-side-rule">
            <span>Thu hồi key</span>
            <strong>Ngay lập tức</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
