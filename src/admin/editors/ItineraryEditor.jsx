import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTable, EditorShell, LiveBadge, Field, TextInput, TextArea, Button, toast } from './_shared.jsx';

const DEFAULT_DAY = { day: 'Day 1', title: '', items: [''] };

export default function ItineraryEditor() {
  const { rows: treks, loading } = useTable('treks', { order: 'display_order' });
  const [selectedId, setSelectedId] = useState(null);
  const [trek, setTrek] = useState(null);
  const [tag, setTag] = useState('');
  const [highlights, setHighlights] = useState('');
  const [days, setDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const visible = treks.filter((t) => !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase()));

  // Load full trek when selection changes
  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      const { data } = await supabase.from('treks').select('*').eq('id', selectedId).single();
      if (!data) return;
      setTrek(data);
      setTag(data.tag || '');
      setHighlights(Array.isArray(data.highlights) ? data.highlights.join('\n') : '');
      setDays(Array.isArray(data.itinerary) && data.itinerary.length ? data.itinerary : [DEFAULT_DAY]);
    })();
  }, [selectedId]);

  function updateDay(i, patch) {
    setDays((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function updateItem(dayIdx, itemIdx, value) {
    setDays((d) => d.map((row, idx) => idx === dayIdx ? { ...row, items: row.items.map((it, j) => j === itemIdx ? value : it) } : row));
  }
  function addItem(dayIdx) { updateDay(dayIdx, { items: [...days[dayIdx].items, ''] }); }
  function removeItem(dayIdx, itemIdx) { updateDay(dayIdx, { items: days[dayIdx].items.filter((_, j) => j !== itemIdx) }); }
  function addDay() { setDays((d) => [...d, { ...DEFAULT_DAY, day: `Day ${d.length + 1}` }]); }
  function removeDay(i) { setDays((d) => d.filter((_, idx) => idx !== i)); }

  async function save() {
    if (!trek) return;
    setSaving(true);
    const cleanedDays = days
      .map((d) => ({ ...d, items: (d.items || []).filter((s) => s.trim().length > 0) }))
      .filter((d) => d.title.trim() || d.items.length > 0);
    const cleanedHighlights = highlights.split('\n').map((s) => s.trim()).filter(Boolean);

    const timeoutId = setTimeout(() => {
      console.warn('[itinerary] save timeout');
      setSaving(false);
      toast('Save timed out — check connection', 'error');
    }, 12000);

    try {
      const { error } = await supabase
        .from('treks')
        .update({ tag, highlights: cleanedHighlights, itinerary: cleanedDays })
        .eq('id', trek.id);
      if (error) { toast(error.message, 'error'); return; }
      toast(`${trek.name} itinerary saved`);
      setSelectedId(null);
    } catch (e) {
      console.warn('[itinerary] save threw', e);
      toast(e?.message || 'Save failed', 'error');
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  if (!selectedId) {
    return (
      <EditorShell
        title="Itinerary Editor"
        subtitle="Pick a trek to edit its tag line, highlights and day-by-day plan."
        previewHref="/#treks"
        action={<LiveBadge />}
      >
        <div className="mb-5">
          <TextInput
            value={search}
            onChange={setSearch}
            placeholder="Search treks…"
          />
        </div>
        {loading ? (
          <div className="text-cream/40 text-sm">Loading treks…</div>
        ) : visible.length === 0 ? (
          <div className="text-cream/45 text-sm py-10 text-center">No treks match "{search}"</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="text-left rounded-xl p-4 bg-cream/[0.04] border border-cream/10 hover:border-ember/40 transition-colors"
              >
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-cream/45 mt-1">{t.duration} · {t.difficulty}</div>
              </button>
            ))}
          </div>
        )}
      </EditorShell>
    );
  }

  return (
    <EditorShell
      title={trek?.name || 'Itinerary'}
      subtitle="Edit per-day plan. Use one bullet per line. Empty lines are dropped on save."
      action={
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button variant="ghost" onClick={() => setSelectedId(null)}>← Back</Button>
          <Button onClick={save} loading={saving}>Save</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Field label="Tag line">
          <TextInput value={tag} onChange={setTag} placeholder="Where the ridge meets the sky." />
        </Field>
        <Field label="Highlights — one per line">
          <TextArea rows={6} value={highlights} onChange={setHighlights} placeholder="Cliff-edge meadow camp&#10;Stream crossings…" />
        </Field>
      </div>

      <div className="space-y-4">
        {days.map((d, i) => (
          <div key={i} className="rounded-2xl border border-cream/10 p-5 bg-cream/[0.02]">
            <div className="grid grid-cols-1 sm:grid-cols-[140px,1fr,auto] gap-3 items-end">
              <Field label="Day label">
                <TextInput value={d.day} onChange={(v) => updateDay(i, { day: v })} />
              </Field>
              <Field label="Title">
                <TextInput value={d.title} onChange={(v) => updateDay(i, { title: v })} placeholder="Summit & Return" />
              </Field>
              <Button variant="danger" onClick={() => removeDay(i)}>Remove day</Button>
            </div>
            <div className="mt-5">
              <div className="eyebrow text-cream/55 mb-2">Bullets</div>
              <div className="space-y-2">
                {d.items.map((it, j) => (
                  <div key={j} className="flex gap-2">
                    <TextInput value={it} onChange={(v) => updateItem(i, j, v)} placeholder="6 AM reach base village" />
                    <button
                      onClick={() => removeItem(i, j)}
                      className="px-3 text-xs text-cream/40 hover:text-ember transition-colors"
                      title="Remove bullet"
                    >×</button>
                  </div>
                ))}
              </div>
              <button onClick={() => addItem(i)} className="mt-3 text-xs text-ember link-underline">+ Add bullet</button>
            </div>
          </div>
        ))}
        <Button variant="ghost" onClick={addDay}>+ Add day</Button>
      </div>
    </EditorShell>
  );
}
