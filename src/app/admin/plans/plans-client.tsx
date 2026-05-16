'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Power } from 'lucide-react';

type P = { id: string; name: string; description: string | null; tokenLimit: number; windowHours: number; durationDays: number; priceVND: number; modelIds: string[]; enabled: boolean };
type M = { id: string; name: string };

const empty: Omit<P, 'id'> = { name: '', description: null, tokenLimit: 100000, windowHours: 5, durationDays: 30, priceVND: 0, modelIds: [], enabled: true };

export default function PlansClient({ initial, models }: { initial: P[]; models: M[] }) {
  const [list, setList] = useState<P[]>(initial);
  const [draft, setDraft] = useState(empty);

  function patch(idx: number, p: Partial<P>) {
    const n = [...list]; n[idx] = { ...n[idx], ...p }; setList(n);
  }
  function toggleModel(idx: number, mid: string) {
    const cur = list[idx].modelIds;
    patch(idx, { modelIds: cur.includes(mid) ? cur.filter((x) => x !== mid) : [...cur, mid] });
  }

  async function add() {
    const r = await fetch('/api/admin/plans', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft) });
    const d = await r.json();
    if (!r.ok) return toast.error(d.error || 'Lỗi');
    setList([d.plan, ...list]); setDraft(empty); toast.success('Đã thêm');
  }
  async function save(p: P) {
    const r = await fetch(`/api/admin/plans/${p.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
    if (r.ok) toast.success('Lưu OK'); else toast.error('Lỗi');
  }
  async function remove(id: string) {
    if (!confirm('Xoá plan?')) return;
    const r = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
    if (r.ok) { setList(list.filter((x) => x.id !== id)); toast.success('Đã xoá'); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="heading-1">Gói cước</h1>

      {/* Add form */}
      <div className="card">
        <h2 className="heading-5 mb-4">Thêm gói</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <input className="input" placeholder="Tên gói" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="input" placeholder="Mô tả" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <input className="input" type="number" placeholder="Giá VND" value={draft.priceVND} onChange={(e) => setDraft({ ...draft, priceVND: +e.target.value })} />
          <input className="input" type="number" placeholder="Token limit" value={draft.tokenLimit} onChange={(e) => setDraft({ ...draft, tokenLimit: +e.target.value })} />
          <input className="input" type="number" placeholder="Window hours" value={draft.windowHours} onChange={(e) => setDraft({ ...draft, windowHours: +e.target.value })} />
          <input className="input" type="number" placeholder="Duration days" value={draft.durationDays} onChange={(e) => setDraft({ ...draft, durationDays: +e.target.value })} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <div className="form-label">Models cho phép</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {models.map((m) => (
              <button key={m.id} type="button" onClick={() => {
                setDraft({ ...draft, modelIds: draft.modelIds.includes(m.id) ? draft.modelIds.filter((x) => x !== m.id) : [...draft.modelIds, m.id] });
              }}
                style={{
                  padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none',
                  background: draft.modelIds.includes(m.id) ? 'var(--brand-blue)' : 'var(--cream-50)',
                  color: draft.modelIds.includes(m.id) ? '#fff' : 'var(--charcoal-900)'
                }}>
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <button onClick={add} className="btn-primary" style={{ marginTop: '16px' }}><Plus className="h-4 w-4" /> Thêm gói</button>
      </div>

      {/* Plan list */}
      <div className="space-y-3" style={{ overflowX: 'auto' }}>
        <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', padding: '0 16px', minWidth: '600px' }}>
          <span className="caption">Tên gói</span>
          <span className="caption" style={{ gridColumn: 'span 2' }}>Mô tả</span>
          <span className="caption">Giá (VND)</span>
          <span className="caption">Token limit</span>
          <span className="caption">Window (h) / Ngày</span>
        </div>
        </div>
        {list.map((p, i) => (
          <div key={p.id} className="card" style={{ opacity: p.enabled ? 1 : 0.5, minWidth: '600px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', alignItems: 'center' }}>
              <input className="input" value={p.name} onChange={(e) => patch(i, { name: e.target.value })} />
              <input className="input" style={{ gridColumn: 'span 2' }} value={p.description ?? ''} onChange={(e) => patch(i, { description: e.target.value })} />
              <input className="input" type="number" value={p.priceVND} onChange={(e) => patch(i, { priceVND: +e.target.value })} />
              <input className="input" type="number" value={p.tokenLimit} onChange={(e) => patch(i, { tokenLimit: +e.target.value })} />
              <div style={{ display: 'flex', gap: '4px' }}>
                <input className="input" type="number" value={p.windowHours} onChange={(e) => patch(i, { windowHours: +e.target.value })} title="Window hours" />
                <input className="input" type="number" value={p.durationDays} onChange={(e) => patch(i, { durationDays: +e.target.value })} title="Duration days" />
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {models.map((m) => (
                <button key={m.id} type="button" onClick={() => toggleModel(i, m.id)}
                  style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none',
                    background: p.modelIds.includes(m.id) ? 'var(--brand-blue)' : 'var(--cream-50)',
                    color: p.modelIds.includes(m.id) ? '#fff' : 'var(--charcoal-900)'
                  }}>
                  {m.name}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button onClick={() => { const updated = { ...p, enabled: !p.enabled }; patch(i, { enabled: !p.enabled }); save(updated); }} className="btn-ghost" title={p.enabled ? 'Disable' : 'Enable'}>
                <Power className="h-4 w-4" style={{ color: p.enabled ? 'var(--accent-green)' : 'var(--stone-600)' }} />
              </button>
              <button onClick={() => save(p)} className="btn-primary" style={{ fontSize: '13px', padding: '6px 12px' }}><Save className="h-3.5 w-3.5" /> Lưu</button>
              <button onClick={() => remove(p.id)} className="btn-ghost" style={{ color: 'var(--error)' }}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
