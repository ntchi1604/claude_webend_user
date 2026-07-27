'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Power } from 'lucide-react';

type M = { id: string; name: string; upstreamName: string; endpoint: string | null; fallbackEndpoints: string; imageFallbackModel: string | null; provider: string; inputPriceVND: number; outputPriceVND: number; enabled: boolean };

const empty: Omit<M, 'id'> = { name: '', upstreamName: '', endpoint: null, fallbackEndpoints: '[]', imageFallbackModel: null, provider: 'openai', inputPriceVND: 0, outputPriceVND: 0, enabled: true };

export default function ModelsClient({ initial }: { initial: M[] }) {
  const [list, setList] = useState<M[]>(initial);
  const [draft, setDraft] = useState(empty);

  /** Parse JSON fallbackEndpoints → hiển thị comma-separated */
  function fbDisplay(raw: string): string {
    try { const a = JSON.parse(raw); return Array.isArray(a) ? a.join(', ') : raw; }
    catch { return raw; }
  }
  /** Comma-separated → JSON array */
  function fbValue(text: string): string {
    const upstreamNames = text.split(',').map(s => s.trim()).filter(Boolean);
    return upstreamNames.length ? JSON.stringify(upstreamNames) : '[]';
  }

  async function add() {
    if (!draft.name || !draft.upstreamName) return toast.error('Thiếu name/upstreamName');
    const r = await fetch('/api/admin/models', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft)
    });
    const d = await r.json();
    if (!r.ok) return toast.error(d.error || 'Lỗi');
    setList([d.model, ...list]);
    setDraft(empty);
    toast.success('Đã thêm');
  }

  async function update(m: M) {
    const r = await fetch(`/api/admin/models/${m.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(m)
    });
    const d = await r.json().catch(() => null);
    if (r.ok) toast.success('Đã lưu');
    else toast.error(d?.error || 'Lỗi');
  }

  async function remove(id: string) {
    if (!confirm('Xoá model?')) return;
    const r = await fetch(`/api/admin/models/${id}`, { method: 'DELETE' });
    if (r.ok) { setList(list.filter((x) => x.id !== id)); toast.success('Đã xoá'); }
  }

  function patch(idx: number, p: Partial<M>) {
    const next = [...list];
    next[idx] = { ...next[idx], ...p };
    setList(next);
  }

  const upstreamOptions = Array.from(new Set(list.map((model) => model.upstreamName).filter(Boolean)));

  return (
    <div className="app-page animate-fade-in">
      <h1 className="text-3xl font-bold">Model</h1>
      <datalist id="model-upstream-options">
        {upstreamOptions.map((upstreamName) => <option key={upstreamName} value={upstreamName} />)}
      </datalist>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Thêm model mới</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="input" placeholder="Tên hiển thị (claude-sonnet-4-5)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="input" placeholder="Upstream model" value={draft.upstreamName} onChange={(e) => setDraft({ ...draft, upstreamName: e.target.value })} />
          <input className="input" list="model-upstream-options" placeholder="Fallback ảnh upstream: provider/vision-model" value={draft.imageFallbackModel || ''} onChange={(e) => setDraft({ ...draft, imageFallbackModel: e.target.value || null })} />
          <input className="input md:col-span-2" placeholder="Fallback upstream: provider/model-a, provider/model-b" value={fbDisplay(draft.fallbackEndpoints)} onChange={(e) => setDraft({ ...draft, fallbackEndpoints: fbValue(e.target.value) })} />
          <select className="input" value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value })}>
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
          </select>

        </div>
        <button onClick={add} className="btn-primary mt-4"><Plus className="h-4 w-4" /> Thêm</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-left">
            <tr>
              <th className="p-3">Tên</th>
              <th className="p-3">Upstream</th>
              <th className="p-3">Fallback ảnh (upstreamName)</th>
              <th className="p-3">Fallback upstream (upstreamName)</th>
              <th className="p-3">Nhà cung cấp</th>

              <th className="p-3">Bật</th>
              <th className="p-3 text-right">⋯</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m, i) => (
              <tr key={m.id} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <td className="p-2"><input className="input" value={m.name} onChange={(e) => patch(i, { name: e.target.value })} /></td>
                <td className="p-2"><input className="input" value={m.upstreamName} onChange={(e) => patch(i, { upstreamName: e.target.value })} /></td>
                <td className="p-2"><input className="input" list="model-upstream-options" value={m.imageFallbackModel || ''} onChange={(e) => patch(i, { imageFallbackModel: e.target.value || null })} placeholder="provider/vision-model" /></td>
                <td className="p-2"><input className="input" value={fbDisplay(m.fallbackEndpoints)} onChange={(e) => patch(i, { fallbackEndpoints: fbValue(e.target.value) })} placeholder="provider/model-a, provider/model-b" /></td>
                <td className="p-2">
                  <select className="input" value={m.provider} onChange={(e) => patch(i, { provider: e.target.value })}>
                    <option value="openai">openai</option>
                    <option value="anthropic">anthropic</option>
                  </select>
                </td>

                <td className="p-2">
                  <button onClick={() => { const updated = { ...m, enabled: !m.enabled }; patch(i, { enabled: !m.enabled }); update(updated); }} className="btn-ghost">
                    <Power className={`h-4 w-4 ${m.enabled ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  </button>
                </td>
                <td className="p-2 text-right space-x-1 whitespace-nowrap">
                  <button onClick={() => update(m)} className="btn-primary text-xs py-1 px-2"><Save className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(m.id)} className="btn-danger text-xs py-1 px-2"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
