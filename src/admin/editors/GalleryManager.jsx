import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { toDriveImageURL, isDriveURL, extractDriveId } from '../../lib/drive.js';
import { useTable, EditorShell, LiveBadge, Field, TextInput, Select, Button, EmptyState, toast } from './_shared.jsx';

const EMPTY = { src: '', caption: '', category: '', media_type: 'image', display_order: 100, is_active: true };
const CATEGORY_SUGGESTIONS = ['Group Pic', 'Summit View', 'Waterfall', 'Forest', 'Campfire', 'Sunrise', 'Wildlife', 'Stay'];
const MEDIA_TYPES = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' }
];

function toDriveVideoURL(url) {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

export default function GalleryManager() {
  const { rows, loading } = useTable('gallery_images', { order: 'display_order' });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload = {
      src: draft.src.trim(),
      caption: draft.caption,
      category: draft.category?.trim() || null,
      media_type: draft.media_type === 'video' ? 'video' : 'image',
      display_order: Number(draft.display_order) || 100,
      is_active: !!draft.is_active
    };
    if (!payload.src) {
      setSaving(false);
      return toast('Drive URL is required', 'error');
    }

    const timeoutId = setTimeout(() => {
      console.warn('[gallery] save timeout');
      setSaving(false);
      toast('Save timed out — check connection', 'error');
    }, 10000);

    try {
      let error;
      if (draft.id) {
        ({ error } = await supabase.from('gallery_images').update(payload).eq('id', draft.id));
      } else {
        ({ error } = await supabase.from('gallery_images').insert(payload));
      }
      if (error) { toast(error.message, 'error'); return; }
      toast(draft.id ? 'Gallery item updated' : 'Gallery item added');
      setDraft(null);
    } catch (e) {
      console.warn('[gallery] save threw', e);
      toast(e?.message || 'Save failed', 'error');
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Remove this photo from the gallery?')) return;
    await supabase.from('gallery_images').delete().eq('id', id);
  }

  async function toggleActive(row) {
    await supabase.from('gallery_images').update({ is_active: !row.is_active }).eq('id', row.id);
  }

  return (
    <EditorShell
      title="Gallery Manager"
      subtitle="Add or hide gallery photos. Drive share URLs auto-convert. Reorder with display_order."
      previewHref="/#gallery"
      action={
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button onClick={() => setDraft({ ...EMPTY })}>+ Add Item</Button>
        </div>
      }
    >
      {loading && <div className="text-cream/40 text-sm">Loading…</div>}
      {!loading && rows.length === 0 && (
        <EmptyState>No gallery photos yet. Click <strong>+ Add Photo</strong> to add the first one.</EmptyState>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
        {rows.map((g) => (
          <div key={g.id} className={`group rounded-2xl overflow-hidden bg-cream/[0.03] border border-cream/10 ${!g.is_active ? 'opacity-50' : ''}`}>
            <div className="aspect-[4/5] bg-cream/5 relative">
              <img
                src={toDriveImageURL(g.src)}
                alt={g.caption || ''}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { e.target.style.opacity = 0.3; }}
              />
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {g.category && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-ember/30 backdrop-blur text-cream">
                    {g.category}
                  </span>
                )}
                {g.media_type === 'video' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-base/80 backdrop-blur text-cream w-fit border border-cream/20">
                    ▶ Video
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-base/70 backdrop-blur text-cream/85 w-fit">
                  #{g.display_order}
                </span>
              </div>
              {!g.is_active && (
                <div className="absolute inset-0 grid place-items-center bg-base/60">
                  <span className="text-xs uppercase tracking-widest text-cream/60">Hidden</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-xs text-cream/65 line-clamp-2 leading-snug min-h-[2.5rem]">{g.caption || '—'}</div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <button onClick={() => setDraft(g)} className="link-underline text-cream">Edit</button>
                <button onClick={() => toggleActive(g)} className="link-underline text-cream/70">{g.is_active ? 'Hide' : 'Show'}</button>
                <button onClick={() => remove(g.id)} className="link-underline text-ember">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-md p-6">
          <div className="w-full max-w-xl rounded-2xl bg-base border border-cream/15 p-6 lg:p-8 shadow-2xl">
            <h3 className="serif text-2xl mb-6">{draft.id ? 'Edit item' : 'Add gallery item'}</h3>
            <div className="space-y-5">
              <Field label="Drive share URL (image or video)">
                <TextInput value={draft.src} onChange={(v) => setDraft({ ...draft, src: v })} placeholder="https://drive.google.com/file/d/.../view" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Media type">
                  <Select
                    value={draft.media_type || 'image'}
                    onChange={(v) => setDraft({ ...draft, media_type: v })}
                    options={MEDIA_TYPES}
                  />
                </Field>
                <Field label="Display order (lower = first)">
                  <TextInput type="number" value={draft.display_order} onChange={(v) => setDraft({ ...draft, display_order: v })} />
                </Field>
              </div>
              <Field label="Caption">
                <TextInput value={draft.caption} onChange={(v) => setDraft({ ...draft, caption: v })} placeholder="Sunrise rays · Mularahalli · Nov 2025" />
              </Field>
              <Field
                label="Category"
                hint={`Try: ${CATEGORY_SUGGESTIONS.join(' · ')}`}
              >
                <TextInput
                  value={draft.category}
                  onChange={(v) => setDraft({ ...draft, category: v })}
                  placeholder="Group Pic"
                  list="category-list"
                />
                <datalist id="category-list">
                  {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              {draft.src && (
                <div className="rounded-xl overflow-hidden bg-cream/5 aspect-[4/3]">
                  {draft.media_type === 'video' ? (
                    <video
                      src={toDriveVideoURL(draft.src)}
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.opacity = 0.2; }}
                    />
                  ) : (
                    <img src={toDriveImageURL(draft.src)} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = 0.2; }} />
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              <Button onClick={save} loading={saving}>{draft.id ? 'Save' : 'Add'}</Button>
            </div>
          </div>
        </div>
      )}
    </EditorShell>
  );
}
