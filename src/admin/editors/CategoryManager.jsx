import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTable, EditorShell, LiveBadge, Button, TextInput, Toggle, toast } from './_shared.jsx';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'category';

export default function CategoryManager() {
  const { rows, loading, reload } = useTable('trip_categories', { order: 'display_order' });
  const [draft, setDraft] = useState(null); // { id?, label, emoji, display_order }
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draft?.label?.trim()) return toast('Label is required', 'error');
    setSaving(true);
    try {
      if (draft.id) {
        const { error } = await supabase.from('trip_categories').update({
          label: draft.label.trim(),
          emoji: draft.emoji?.trim() || null,
          display_order: Number(draft.display_order) || 100
        }).eq('id', draft.id);
        if (error) return toast(error.message, 'error');
        toast('Category updated');
      } else {
        const { error } = await supabase.from('trip_categories').insert({
          cat_key: slugify(draft.label),
          label: draft.label.trim(),
          emoji: draft.emoji?.trim() || null,
          display_order: Number(draft.display_order) || 100
        });
        if (error) return toast(error.message, 'error');
        toast('Category created');
      }
      setDraft(null);
      reload();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c) {
    const { error } = await supabase.from('trip_categories').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return toast(error.message, 'error');
    toast(`${c.label} → ${!c.is_active ? 'Enabled' : 'Disabled'}`);
    reload();
  }

  async function remove(c) {
    if (!window.confirm(`Delete category "${c.label}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('trip_categories').delete().eq('id', c.id);
    if (error) return toast(error.message, 'error');
    toast('Category deleted');
    reload();
  }

  return (
    <EditorShell
      title="Search Categories"
      subtitle="The tabs shown in the homepage search widget. Enable, disable, rename, reorder, add, or delete — live instantly."
      previewHref="/#search"
      action={<LiveBadge />}
    >
      <div className="mb-6">
        {draft ? (
          <div className="rounded-2xl border border-cream/12 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-1.5">Label</div>
              <TextInput value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} placeholder="Bike Trips" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-1.5">Emoji</div>
              <TextInput value={draft.emoji} onChange={(v) => setDraft({ ...draft, emoji: v })} placeholder="🏍" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-1.5">Order</div>
              <TextInput type="number" value={draft.display_order} onChange={(v) => setDraft({ ...draft, display_order: v })} placeholder="100" />
            </div>
            <div className="sm:col-span-4 flex gap-2">
              <Button onClick={save} loading={saving}>{draft.id ? 'Save changes' : 'Create category'}</Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setDraft({ label: '', emoji: '', display_order: 160 })}>+ New category</Button>
        )}
      </div>

      <div className="rounded-2xl border border-cream/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream/[0.04] text-left">
            <tr>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-cream/55 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-cream/40 text-center">Loading…</td></tr>}
            {!loading && !rows.length && (
              <tr><td colSpan={4} className="px-4 py-8 text-cream/40 text-center">
                No categories yet — run supabase/UPGRADE_PLATFORM.sql once to seed the 15 defaults.
              </td></tr>
            )}
            {!loading && rows.map((c) => (
              <tr key={c.id} className="border-t border-cream/5 hover:bg-cream/[0.02]">
                <td className="px-4 py-3">
                  <span className="mr-2">{c.emoji}</span>
                  <span className="font-medium text-cream">{c.label}</span>
                  <span className="ml-2 text-xs text-cream/40">{c.cat_key}</span>
                </td>
                <td className="px-4 py-3 text-cream/70">{c.display_order}</td>
                <td className="px-4 py-3">
                  <Toggle checked={c.is_active} onChange={() => toggleActive(c)} label={c.is_active ? 'Enabled' : 'Disabled'} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setDraft({ id: c.id, label: c.label, emoji: c.emoji || '', display_order: c.display_order })} className="text-xs link-underline text-cream mr-4">Edit</button>
                  <button onClick={() => remove(c)} className="text-xs text-rose-300 hover:text-rose-200">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EditorShell>
  );
}
