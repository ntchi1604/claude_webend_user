'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Clock, Plus, Save, Trash2, Power, Wand2 } from 'lucide-react';

type P = { id: string; name: string; description: string | null; tokenLimit: number; unlimitedTokens: boolean; windowHours: number; durationDays: number; durationHours: number | null; requestsPerMinute: number; priceVND: number; modelIds: string[]; enabled: boolean };
type M = { id: string; name: string };

const empty: Omit<P, 'id'> = { name: '', description: null, tokenLimit: 100000, unlimitedTokens: false, windowHours: 5, durationDays: 30, durationHours: null, requestsPerMinute: 60, priceVND: 0, modelIds: [], enabled: true };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '6px' }}>
      <span className="caption" style={{ fontWeight: 700 }}>{label}</span>
      {children}
      {hint && <span className="caption" style={{ color: 'var(--stone-500)' }}>{hint}</span>}
    </label>
  );
}

function planSummary(p: Pick<P, 'durationDays' | 'durationHours' | 'unlimitedTokens' | 'tokenLimit' | 'modelIds'>) {
  const duration = p.durationHours && p.durationHours > 0 ? `${p.durationHours} giờ` : `${p.durationDays} ngày`;
  const token = p.unlimitedTokens ? 'không giới hạn token' : `${p.tokenLimit.toLocaleString('vi-VN')} token`;
  const model = p.modelIds.length > 0 ? `${p.modelIds.length} model được chọn` : 'tất cả model đang bật';
  return `Hiệu lực ${duration}, ${token}, ${model}.`;
}

export default function PlansClient({ initial, models }: { initial: P[]; models: M[] }) {
  const [list, setList] = useState<P[]>(initial);
  const [draft, setDraft] = useState(empty);
  const allModelIds = models.map((m) => m.id);

  function patch(idx: number, p: Partial<P>) {
    const n = [...list]; n[idx] = { ...n[idx], ...p }; setList(n);
  }
  function toggleModel(idx: number, mid: string) {
    const cur = list[idx].modelIds;
    patch(idx, { modelIds: cur.includes(mid) ? cur.filter((x) => x !== mid) : [...cur, mid] });
  }
  function applyTrialPreset(idx?: number) {
    const preset = { name: 'Trial', description: 'Gói dùng thử trải nghiệm', priceVND: 0, tokenLimit: 0, unlimitedTokens: true, windowHours: 5, durationDays: 0, durationHours: 5, requestsPerMinute: 60, modelIds: allModelIds, enabled: true };
    if (idx === undefined) setDraft({ ...draft, ...preset }); else patch(idx, preset);
  }
  function applyFreePreset(idx?: number) {
    const freeModelIds = models.filter((m) => /mini|free/i.test(m.name)).map((m) => m.id);
    const preset = { name: 'Free', description: 'Gói miễn phí mặc định', priceVND: 0, tokenLimit: 50000, unlimitedTokens: false, windowHours: 24, durationDays: 3650, durationHours: null, requestsPerMinute: 30, modelIds: freeModelIds, enabled: true };
    if (idx === undefined) setDraft({ ...draft, ...preset }); else patch(idx, preset);
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
    if (!confirm('Xóa gói này?')) return;
    const r = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
    if (r.ok) { setList(list.filter((x) => x.id !== id)); toast.success('Đã xóa'); }
  }

  return (
    <div className="app-page animate-fade-in">
      <h1 className="heading-1">Gói cước</h1>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 className="heading-5 mb-3">Ghi chú cấu hình gói</h2>
        <div className="body-sm text-[var(--stone-600)]" style={{ display: 'grid', gap: '6px' }}>
          <div><strong>Trial 5 giờ:</strong> bấm preset Trial 5 giờ. Hệ thống tự đặt Giờ = 5, Ngày = 0, Unlimited = Bật, chọn tất cả model.</div>
          <div><strong>Free:</strong> user đăng ký mới mặc định vào Free. Free nên giới hạn token và chỉ chọn model miễn phí.</div>
          <div><strong>Thời hạn theo giờ:</strong> nếu Giờ lớn hơn 0 thì hệ thống dùng Giờ và bỏ qua Ngày.</div>
          <div><strong>Không chọn model nào:</strong> đồng nghĩa cho phép tất cả model đang bật. Nên chọn rõ model cho từng gói để dễ kiểm soát.</div>
          <div><strong>Hết hạn:</strong> khi Trial hoặc gói trả phí hết hạn, user tự fallback về Free.</div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="heading-5">Thêm gói</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-xs" onClick={() => applyTrialPreset()}><Wand2 className="h-3.5 w-3.5" /> Preset Trial 5 giờ</button>
            <button type="button" className="btn-ghost text-xs" onClick={() => applyFreePreset()}><Wand2 className="h-3.5 w-3.5" /> Preset Free</button>
          </div>
        </div>
        <div className="caption" style={{ marginBottom: '12px', color: 'var(--stone-600)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock className="h-3.5 w-3.5" /> {planSummary(draft)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: '14px' }}>
          <Field label="Tên gói" hint="Ví dụ: Free, Trial, Basic">
            <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Mô tả hiển thị">
            <input className="input" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          <Field label="Giá VND" hint="Nhập 0 nếu là gói miễn phí/trial">
            <input className="input" type="number" value={draft.priceVND} onChange={(e) => setDraft({ ...draft, priceVND: +e.target.value })} />
          </Field>
          <Field label="Giới hạn token" hint="Bị bỏ qua khi bật Token không giới hạn">
            <input className="input" type="number" value={draft.tokenLimit} disabled={draft.unlimitedTokens} onChange={(e) => setDraft({ ...draft, tokenLimit: +e.target.value })} />
          </Field>
          <Field label="Cửa sổ reset quota (giờ)" hint="Không quan trọng với gói unlimited token">
            <input className="input" type="number" value={draft.windowHours} onChange={(e) => setDraft({ ...draft, windowHours: +e.target.value })} />
          </Field>
          <Field label="Thời hạn theo ngày" hint="Dùng khi Thời hạn theo giờ để trống hoặc = 0">
            <input className="input" type="number" value={draft.durationDays} onChange={(e) => setDraft({ ...draft, durationDays: +e.target.value })} />
          </Field>
          <Field label="Thời hạn theo giờ" hint="Ưu tiên hơn số ngày. Trial 5 giờ: nhập 5">
            <input className="input" type="number" value={draft.durationHours ?? ''} onChange={(e) => setDraft({ ...draft, durationHours: e.target.value ? +e.target.value : null })} />
          </Field>
          <Field label="Req/phút" hint="Giới hạn số request mỗi phút cho mỗi user">
            <input className="input" type="number" value={draft.requestsPerMinute} onChange={(e) => setDraft({ ...draft, requestsPerMinute: +e.target.value })} />
          </Field>
          <Field label="Token không giới hạn" hint="Bật cho Trial/full-access">
            <label className="flex items-center gap-2 text-sm" style={{ minHeight: '42px' }}>
              <input type="checkbox" checked={draft.unlimitedTokens} onChange={(e) => setDraft({ ...draft, unlimitedTokens: e.target.checked, tokenLimit: e.target.checked ? 0 : draft.tokenLimit })} />
              Bật
            </label>
          </Field>
        </div>

        <div style={{ marginTop: '16px' }}>
          <div className="form-label">Model cho phép</div>
          <p className="caption" style={{ marginTop: '4px', color: 'var(--stone-500)' }}>Chọn model user được sử dụng trong gói này. Không chọn model nào = cho phép tất cả model đang bật.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {models.map((m) => (
              <button key={m.id} type="button" onClick={() => setDraft({ ...draft, modelIds: draft.modelIds.includes(m.id) ? draft.modelIds.filter((x) => x !== m.id) : [...draft.modelIds, m.id] })}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: draft.modelIds.includes(m.id) ? 'var(--brand-blue)' : 'var(--cream-50)', color: draft.modelIds.includes(m.id) ? '#fff' : 'var(--charcoal-900)' }}>
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <button onClick={add} className="btn-primary" style={{ marginTop: '18px' }}><Plus className="h-4 w-4" /> Thêm gói</button>
      </div>

      <div className="space-y-3" style={{ overflowX: 'auto' }}>
        {list.map((p, i) => (
          <div key={p.id} className="card" style={{ opacity: p.enabled ? 1 : 0.5, minWidth: '980px' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="caption" style={{ color: 'var(--stone-600)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock className="h-3.5 w-3.5" /> {planSummary(p)}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary text-xs" onClick={() => applyTrialPreset(i)}><Wand2 className="h-3.5 w-3.5" /> Set Trial 5 giờ</button>
                <button type="button" className="btn-ghost text-xs" onClick={() => applyFreePreset(i)}><Wand2 className="h-3.5 w-3.5" /> Set Free</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr repeat(7, minmax(110px, 1fr))', gap: '10px', alignItems: 'start' }}>
              <Field label="Tên gói" hint="Tên hiển thị trong bảng gói"><input className="input" value={p.name} onChange={(e) => patch(i, { name: e.target.value })} /></Field>
              <Field label="Mô tả" hint="Mô tả ngắn cho admin / user"><input className="input" value={p.description ?? ''} onChange={(e) => patch(i, { description: e.target.value })} /></Field>
              <Field label="Giá VND" hint="0 = miễn phí"><input className="input" type="number" value={p.priceVND} onChange={(e) => patch(i, { priceVND: +e.target.value })} /></Field>
              <Field label="Token" hint="Số token user được dùng trong cửa sổ reset"><input className="input" type="number" value={p.tokenLimit} disabled={p.unlimitedTokens} onChange={(e) => patch(i, { tokenLimit: +e.target.value })} /></Field>
              <Field label="Reset quota (giờ)" hint="Sau số giờ này quota token reset lại"><input className="input" type="number" value={p.windowHours} onChange={(e) => patch(i, { windowHours: +e.target.value })} /></Field>
              <Field label="Thời hạn ngày" hint="Bị bỏ qua nếu Thời hạn giờ > 0"><input className="input" type="number" value={p.durationDays} onChange={(e) => patch(i, { durationDays: +e.target.value })} /></Field>
              <Field label="Thời hạn giờ" hint="Ưu tiên hơn ngày. Trial 5 giờ = 5"><input className="input" type="number" value={p.durationHours ?? ''} onChange={(e) => patch(i, { durationHours: e.target.value ? +e.target.value : null })} /></Field>
              <Field label="Req/phút" hint="Giới hạn request mỗi phút"><input className="input" type="number" value={p.requestsPerMinute} onChange={(e) => patch(i, { requestsPerMinute: +e.target.value })} /></Field>
              <Field label="Unlimited" hint="Bật = bỏ qua giới hạn token"><label className="flex items-center gap-2 text-xs" style={{ minHeight: '42px' }}><input type="checkbox" checked={p.unlimitedTokens} onChange={(e) => patch(i, { unlimitedTokens: e.target.checked, tokenLimit: e.target.checked ? 0 : p.tokenLimit })} /> Bật</label></Field>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div className="caption" style={{ fontWeight: 700 }}>Model cho phép</div>
              <p className="caption" style={{ marginTop: '4px', color: 'var(--stone-500)' }}>Nếu là Free, chỉ chọn model free. Nếu là Trial/full, chọn các model được mở cho gói đó.</p>
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {models.map((m) => (
                  <button key={m.id} type="button" onClick={() => toggleModel(i, m.id)}
                    style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: p.modelIds.includes(m.id) ? 'var(--brand-blue)' : 'var(--cream-50)', color: p.modelIds.includes(m.id) ? '#fff' : 'var(--charcoal-900)' }}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button onClick={() => { const updated = { ...p, enabled: !p.enabled }; patch(i, { enabled: !p.enabled }); save(updated); }} className="btn-ghost" title={p.enabled ? 'Tắt gói' : 'Bật gói'}>
                <Power className="h-4 w-4" style={{ color: p.enabled ? 'var(--accent-green)' : 'var(--stone-600)' }} />
              </button>
              <button onClick={() => save(p)} className="btn-primary" style={{ fontSize: '13px', padding: '6px 12px' }}><Save className="h-3.5 w-3.5" /> Lưu</button>
              <button onClick={() => remove(p.id)} className="btn-ghost" style={{ color: 'var(--error)' }} title="Xóa gói"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}