import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTable, EditorShell, LiveBadge, Field, TextInput, TextArea, Select, Toggle, Button, EmptyState, toast } from './_shared.jsx';

const TONES = [
  { value: 'info',    label: 'Info (neutral)' },
  { value: 'ember',   label: 'Ember (highlight)' },
  { value: 'success', label: 'Success (green)' },
  { value: 'warning', label: 'Warning (amber)' }
];

const EMPTY = { title: '', body: '', link_url: '', link_label: '', tone: 'ember', is_active: true, starts_at: '', ends_at: '', display_order: 100, display_as: 'banner' };

const DISPLAY_MODES = [
  { value: 'banner', label: 'Banner — top of page' },
  { value: 'popup',  label: 'Popup — first visit modal' },
  { value: 'both',   label: 'Both — banner + popup' }
];

export default function AnnouncementManager() {
  const { rows, loading } = useTable('announcements', { order: 'display_order' });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload = {
      title: draft.title.trim(),
      body: draft.body?.trim() || null,
      link_url: draft.link_url?.trim() || null,
      link_label: draft.link_label?.trim() || null,
      tone: draft.tone,
      display_as: draft.display_as || 'banner',
      is_active: !!draft.is_active,
      display_order: Number(draft.display_order) || 100,
      starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null
    };
    if (!payload.title) { setSaving(false); return toast('Title is required', 'error'); }

    const timeoutId = setTimeout(() => {
      console.warn('[announcement] save timeout');
      setSaving(false);
      toast('Save timed out — check connection', 'error');
    }, 10000);

    try {
      let error;
      if (draft.id) ({ error } = await supabase.from('announcements').update(payload).eq('id', draft.id));
      else ({ error } = await supabase.from('announcements').insert(payload));
      if (error) { toast(error.message, 'error'); return; }
      toast(`${draft.id ? 'Updated' : 'Published'} · ${payload.title}`);
      setDraft(null);
    } catch (e) {
      console.warn('[announcement] save threw', e);
      toast(e?.message || 'Save failed', 'error');
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Announcement removed');
  }

  return (
    <EditorShell
      title="Announcements"
      subtitle="Banner messages, monsoon notices, seasonal offers. Schedule with start/end dates."
      previewHref="/"
      action={
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button onClick={() => setDraft({ ...EMPTY })}>+ New Announcement</Button>
        </div>
      }
    >
      {loading && <div className="text-cream/40 text-sm">Loading…</div>}
      {!loading && rows.length === 0 && <EmptyState>No announcements right now. The site stays clean.</EmptyState>}

      <div className="space-y-3">
        {rows.map((a) => (
          <div key={a.id} className={`rounded-2xl border p-5 ${
            a.tone === 'ember' ? 'border-ember/40 bg-ember/[0.05]' :
            a.tone === 'success' ? 'border-moss/40 bg-moss/[0.05]' :
            a.tone === 'warning' ? 'border-amber-500/40 bg-amber-500/[0.05]' :
            'border-cream/15 bg-cream/[0.03]'
          } ${!a.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="eyebrow text-cream/55">{a.tone}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest ${a.is_active ? 'bg-moss/15 text-moss' : 'bg-cream/5 text-cream/40'}`}>
                    {a.is_active ? 'Live' : 'Hidden'}
                  </span>
                </div>
                <div className="serif text-xl">{a.title}</div>
                {a.body && <p className="mt-2 text-sm text-cream/65">{a.body}</p>}
                {(a.starts_at || a.ends_at) && (
                  <div className="mt-3 text-[11px] text-cream/45">
                    {a.starts_at && <>From {new Date(a.starts_at).toLocaleDateString()}</>}
                    {a.starts_at && a.ends_at && ' · '}
                    {a.ends_at && <>Until {new Date(a.ends_at).toLocaleDateString()}</>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                <button onClick={() => setDraft(a)} className="link-underline">Edit</button>
                <button onClick={() => remove(a.id)} className="link-underline text-ember">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-md p-6">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto modal-scroll modal-scroll-dark rounded-2xl bg-base border border-cream/15 p-6 lg:p-8 shadow-2xl">
            <h3 className="serif text-2xl mb-6">{draft.id ? 'Edit announcement' : 'New announcement'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Title" className="sm:col-span-2">
                <TextInput value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} placeholder="Monsoon batches now open" />
              </Field>
              <Field label="Body" className="sm:col-span-2">
                <TextArea rows={3} value={draft.body} onChange={(v) => setDraft({ ...draft, body: v })} placeholder="Limited slots for July–August Netravati & Kudremukh treks." />
              </Field>
              <Field label="Link label">
                <TextInput value={draft.link_label} onChange={(v) => setDraft({ ...draft, link_label: v })} placeholder="Book Now" />
              </Field>
              <Field label="Link URL">
                <TextInput value={draft.link_url} onChange={(v) => setDraft({ ...draft, link_url: v })} placeholder="#batches" />
              </Field>
              <Field label="Tone">
                <Select value={draft.tone} onChange={(v) => setDraft({ ...draft, tone: v })} options={TONES} />
              </Field>
              <Field label="Display as">
                <Select value={draft.display_as || 'banner'} onChange={(v) => setDraft({ ...draft, display_as: v })} options={DISPLAY_MODES} />
              </Field>
              <Field label="Order" className="sm:col-span-2">
                <TextInput type="number" value={draft.display_order} onChange={(v) => setDraft({ ...draft, display_order: v })} />
              </Field>
              <Field label="Starts at">
                <TextInput type="datetime-local" value={draft.starts_at} onChange={(v) => setDraft({ ...draft, starts_at: v })} />
              </Field>
              <Field label="Ends at">
                <TextInput type="datetime-local" value={draft.ends_at} onChange={(v) => setDraft({ ...draft, ends_at: v })} />
              </Field>
              <Field label="Active" className="sm:col-span-2">
                <Toggle checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} label={draft.is_active ? 'Visible on site' : 'Hidden'} />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              <Button onClick={save} loading={saving}>{draft.id ? 'Save' : 'Publish'}</Button>
            </div>
          </div>
        </div>
      )}
    </EditorShell>
  );
}
