import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatINR } from '../../lib/treks.js';
import { useTable, EditorShell, LiveBadge, Button, TextInput, Select, Toggle, toast } from './_shared.jsx';

const DIFFICULTY_OPTIONS = [
  { value: '', label: '— Unset —' },
  { value: 'Easy', label: 'Easy' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Difficult', label: 'Difficult' },
  { value: 'Extreme', label: 'Extreme' }
];

const BADGE_OPTIONS = [
  { value: '', label: '— No ribbon —' },
  ...['Trending', 'Most Popular', 'Best Seller', 'Limited Seats', 'Family Favourite',
     'Weekend Special', 'New Arrival', 'Early Bird', 'Offer', 'Last Seats']
    .map((b) => ({ value: b, label: b }))
];

export default function PriceEditor() {
  const { rows, loading } = useTable('treks', { order: 'display_order' });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  function startEdit(t) {
    setEditingId(t.id);
    setDraft({
      price: t.price ?? '',
      offer_price: t.offer_price ?? '',
      difficulty: t.difficulty ?? '',
      badge: t.badge ?? '',
      is_active: t.is_active,
      is_open: t.is_open !== false
    });
  }

  async function save() {
    if (!editingId) return;
    setSaving(true);

    const timeoutId = setTimeout(() => {
      console.warn('[price] save timeout');
      setSaving(false);
      toast('Save timed out — check connection', 'error');
    }, 10000);

    try {
      const { error } = await supabase
        .from('treks')
        .update({
          price: draft.price === '' ? null : Number(draft.price),
          offer_price: draft.offer_price === '' ? null : Number(draft.offer_price),
          difficulty: draft.difficulty || null,
          badge: draft.badge || null,
          is_active: !!draft.is_active,
          is_open: !!draft.is_open
        })
        .eq('id', editingId);
      if (error) { toast(error.message, 'error'); return; }
      toast('Price updated · live on site');
      setEditingId(null);
    } catch (e) {
      console.warn('[price] save threw', e);
      toast(e?.message || 'Save failed', 'error');
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  async function toggleOpen(t) {
    const next = !(t.is_open !== false);
    const { error } = await supabase.from('treks').update({ is_open: next }).eq('id', t.id);
    if (error) return toast(error.message, 'error');
    toast(`${t.name} → ${next ? 'Open' : 'Closed'}`);
  }

  return (
    <EditorShell
      title="Trip Pricing"
      subtitle="Set per-person fee. Toggle Live or Bookings open/closed. Changes reflect on the homepage instantly."
      previewHref="/#treks"
      action={<LiveBadge />}
    >
      <div className="rounded-2xl border border-cream/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream/[0.04] text-left">
            <tr>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Trek</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Difficulty</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Original Price</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Offer Price</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Bookings</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Active</th>
              <th className="px-4 py-3 text-right text-cream/55 text-xs uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-cream/40 text-center">Loading…</td></tr>
            )}
            {!loading && rows.map((t) => {
              const isEditing = editingId === t.id;
              const isOpen = t.is_open !== false;
              return (
                <tr key={t.id} className="border-t border-cream/5 hover:bg-cream/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-cream">{t.name}</div>
                    <div className="text-xs text-cream/45">{t.id}</div>
                    {isEditing ? (
                      <div className="mt-2 max-w-[180px]">
                        <Select value={draft.badge} onChange={(v) => setDraft({ ...draft, badge: v })} options={BADGE_OPTIONS} />
                      </div>
                    ) : t.badge ? (
                      <span className="mt-1.5 inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-ember/20 text-ember border border-ember/40">★ {t.badge}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-cream/75">
                    {isEditing ? (
                      <Select
                        value={draft.difficulty}
                        onChange={(v) => setDraft({ ...draft, difficulty: v })}
                        options={DIFFICULTY_OPTIONS}
                      />
                    ) : (
                      t.difficulty || <span className="text-cream/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <TextInput
                        type="number"
                        value={draft.price}
                        onChange={(v) => setDraft({ ...draft, price: v })}
                        placeholder="4499"
                      />
                    ) : (
                      <span className={`font-medium ${t.offer_price ? 'text-cream/45 line-through' : 'text-cream'}`}>
                        {formatINR(t.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <TextInput
                        type="number"
                        value={draft.offer_price}
                        onChange={(v) => setDraft({ ...draft, offer_price: v })}
                        placeholder="(optional)"
                      />
                    ) : t.offer_price ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-medium text-ember">{formatINR(t.offer_price)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest bg-ember/20 text-ember border border-ember/40">Offer</span>
                      </span>
                    ) : (
                      <span className="text-cream/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Toggle
                        checked={draft.is_open}
                        onChange={(v) => setDraft({ ...draft, is_open: v })}
                        label={draft.is_open ? 'Open' : 'Closed'}
                      />
                    ) : (
                      <button
                        onClick={() => toggleOpen(t)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          isOpen
                            ? 'bg-moss/15 text-moss border-moss/40'
                            : 'bg-cream/5 text-cream/40 border-cream/15'
                        }`}
                      >
                        {isOpen ? '● Open' : '○ Closed'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Toggle
                        checked={draft.is_active}
                        onChange={(v) => setDraft({ ...draft, is_active: v })}
                        label={draft.is_active ? 'Live' : 'Hidden'}
                      />
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? 'bg-moss/15 text-moss' : 'bg-cream/5 text-cream/40'}`}>
                        {t.is_active ? 'Live' : 'Hidden'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="inline-flex gap-2">
                        <Button onClick={save} loading={saving}>Save</Button>
                        <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(t)} className="text-xs link-underline text-cream">Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </EditorShell>
  );
}
