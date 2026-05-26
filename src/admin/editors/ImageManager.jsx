import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import { toDriveImageURL, isDriveURL } from '../../lib/drive.js';
import { useTable, EditorShell, LiveBadge, TextInput, Button, toast } from './_shared.jsx';

const SLOTS = 5;

export default function ImageManager() {
  const { rows: treks, loading } = useTable('treks', { order: 'display_order' });
  const [selectedId, setSelectedId] = useState(null);
  const [slots, setSlots] = useState(new Array(SLOTS).fill(''));
  const [coverIndex, setCoverIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const selected = selectedId ? treks.find((t) => t.id === selectedId) : null;
  const visible = treks.filter((t) => !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    if (!selected) return;
    const gallery = Array.isArray(selected.gallery) ? selected.gallery : [];
    const arr = new Array(SLOTS).fill('');
    for (let i = 0; i < SLOTS; i++) arr[i] = gallery[i] || '';
    // Ensure the cover image (treks.image) shows up in slot 0 if not already in gallery
    if (selected.image && !arr.includes(selected.image)) arr[0] = selected.image;
    setSlots(arr);
    setCoverIndex(0);
  }, [selected]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    const cleaned = slots.map((s) => s.trim()).filter(Boolean);
    const cover = slots[coverIndex]?.trim() || cleaned[0] || null;

    const timeoutId = setTimeout(() => {
      console.warn('[images] save timeout');
      setSaving(false);
      toast('Save timed out — check connection', 'error');
    }, 12000);

    try {
      const { error } = await supabase
        .from('treks')
        .update({ gallery: cleaned, image: cover })
        .eq('id', selected.id);
      if (error) { toast(error.message, 'error'); return; }
      toast(`${selected.name} images saved`);
      setSelectedId(null);
    } catch (e) {
      console.warn('[images] save threw', e);
      toast(e?.message || 'Save failed', 'error');
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  function updateSlot(i, v) {
    setSlots((s) => s.map((row, idx) => (idx === i ? v : row)));
  }

  if (!selectedId) {
    return (
      <EditorShell
        title="Trek Image Manager"
        subtitle="Pick a trek to manage its image slots (up to 5 per trek). Each slot accepts a Google Drive share URL."
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
          <div className="text-cream/40 text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="text-cream/45 text-sm py-10 text-center">No treks match "{search}"</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((t) => {
              const filled = Array.isArray(t.gallery) ? t.gallery.filter(Boolean).length : 0;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className="text-left rounded-2xl overflow-hidden bg-cream/[0.03] border border-cream/10 hover:border-ember/40 transition-colors"
                >
                  <div className="aspect-[5/4] relative bg-cream/5">
                    {t.image && (
                      <img
                        src={toDriveImageURL(t.image)}
                        alt={t.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] bg-base/80 backdrop-blur text-cream/85">
                      {filled} / {SLOTS}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-cream/45 mt-1">Manage images →</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </EditorShell>
    );
  }

  return (
    <EditorShell
      title={selected?.name || 'Images'}
      subtitle="Paste a Google Drive share URL into each slot. Slot used as the cover is marked with a star."
      action={
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button variant="ghost" onClick={() => setSelectedId(null)}>← Back</Button>
          <Button onClick={save} loading={saving}>Save All</Button>
        </div>
      }
    >
      <div className="mb-6 rounded-2xl border border-ember/30 bg-ember/[0.05] p-4 text-[13px] text-cream/80 leading-relaxed">
        Drive share format · <code className="text-ember">https://drive.google.com/file/d/FILE_ID/view</code> ·
        set "Anyone with the link · Viewer". URLs auto-convert to a fast thumbnail endpoint.
      </div>

      <div className="rounded-2xl border border-cream/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream/[0.04] text-left">
            <tr>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider w-24">Slot</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Drive URL / Image URL</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider w-32">Preview</th>
              <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider w-24 text-center">Cover</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((url, i) => (
              <tr key={i} className="border-t border-cream/5">
                <td className="px-4 py-3 align-middle">
                  <div className="serif text-base">Image {i + 1}</div>
                  {isDriveURL(url) && <div className="text-[10px] text-ember uppercase tracking-widest mt-1">Drive</div>}
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={url}
                    onChange={(v) => updateSlot(i, v)}
                    placeholder="https://drive.google.com/file/d/.../view"
                  />
                </td>
                <td className="px-4 py-3">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-16 w-24 rounded-lg overflow-hidden bg-cream/5 relative"
                  >
                    {url ? (
                      <img
                        src={toDriveImageURL(url, 400)}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/ridge-peak.jpg';
                          e.currentTarget.style.opacity = 0.35;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-cream/30 uppercase tracking-widest">empty</div>
                    )}
                  </motion.div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setCoverIndex(i)}
                    disabled={!url}
                    title="Use this image as the trek card cover"
                    className={`h-8 w-8 rounded-full grid place-items-center transition-all ${
                      coverIndex === i
                        ? 'bg-ember text-cream shadow-[0_0_20px_rgba(210,119,46,0.5)]'
                        : 'bg-cream/10 text-cream/60 hover:bg-cream/20 disabled:opacity-30'
                    }`}
                  >
                    ★
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EditorShell>
  );
}
