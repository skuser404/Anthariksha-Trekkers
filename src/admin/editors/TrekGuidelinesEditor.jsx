import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { EditorShell, LiveBadge, Field, TextInput, TextArea, Button, toast } from './_shared.jsx';

export default function TrekGuidelinesEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intro, setIntro] = useState('');
  const [dos, setDos] = useState(['']);
  const [donts, setDonts] = useState(['']);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const safety = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
      toast('Load timed out — check connection', 'error');
    }, 8000);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('trek_guidelines')
          .select('intro_note, dos, donts')
          .eq('id', 1)
          .maybeSingle();
        if (cancelled) return;
        if (error) toast(error.message, 'error');
        if (data) {
          setIntro(data.intro_note || '');
          setDos(Array.isArray(data.dos) && data.dos.length ? data.dos : ['']);
          setDonts(Array.isArray(data.donts) && data.donts.length ? data.donts : ['']);
        }
      } catch (e) {
        if (cancelled) return;
        toast(e?.message || 'Failed to load', 'error');
      } finally {
        clearTimeout(safety);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; clearTimeout(safety); };
  }, []);

  function updateAt(arr, setArr, i, v) { setArr(arr.map((s, idx) => idx === i ? v : s)); }
  function removeAt(arr, setArr, i)   { setArr(arr.filter((_, idx) => idx !== i)); }
  function addBlank(arr, setArr)      { setArr([...arr, '']); }

  async function save() {
    setSaving(true);
    const payload = {
      id: 1,
      intro_note: intro.trim() || null,
      dos: dos.map((s) => s.trim()).filter(Boolean),
      donts: donts.map((s) => s.trim()).filter(Boolean),
      updated_at: new Date().toISOString()
    };

    const timeoutId = setTimeout(() => {
      console.warn('[guidelines] save timeout');
      setSaving(false);
      toast('Save timed out — check connection', 'error');
    }, 10000);

    try {
      const { error } = await supabase
        .from('trek_guidelines')
        .upsert(payload, { onConflict: 'id' });
      if (error) { toast(error.message, 'error'); return; }
      toast('Guidelines saved · live on every trek modal');
    } catch (e) {
      console.warn('[guidelines] save threw', e);
      toast(e?.message || 'Save failed', 'error');
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  return (
    <EditorShell
      title="Trek Guidelines"
      subtitle="Global Do's, Don'ts, and the mandatory lunchbox note. Shown inside every trek modal. Changes go live instantly."
      previewHref="/#treks"
      action={
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button onClick={save} loading={saving} disabled={loading}>Save guidelines</Button>
        </div>
      }
    >
      {loading ? (
        <div className="text-cream/40 text-sm">Loading…</div>
      ) : (
        <div className="space-y-8">
          <Field
            label="Intro note (lunchbox / packaging rule)"
            hint="Shown in a highlighted ember card at the top of the section."
          >
            <TextArea
              rows={3}
              value={intro}
              onChange={setIntro}
              placeholder="Empty lunch boxes are mandatory…"
            />
          </Field>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListEditor
              title="Do's"
              icon={CheckCircle2}
              accent="emerald"
              items={dos}
              onChange={(i, v) => updateAt(dos, setDos, i, v)}
              onRemove={(i) => removeAt(dos, setDos, i)}
              onAdd={() => addBlank(dos, setDos)}
              placeholder="Wear proper trekking shoes with strong grip"
            />
            <ListEditor
              title="Don'ts"
              icon={XCircle}
              accent="ember"
              items={donts}
              onChange={(i, v) => updateAt(donts, setDonts, i, v)}
              onRemove={(i) => removeAt(donts, setDonts, i)}
              onAdd={() => addBlank(donts, setDonts)}
              placeholder="Do not litter trails, campsites, or homestays"
            />
          </div>
        </div>
      )}
    </EditorShell>
  );
}

function ListEditor({ title, icon: Icon, accent, items, onChange, onRemove, onAdd, placeholder }) {
  const isEmerald = accent === 'emerald';
  const borderCls = isEmerald ? 'border-emerald-500/30' : 'border-ember/35';
  const bgCls = isEmerald ? 'bg-emerald-500/[0.05]' : 'bg-ember/[0.05]';
  const iconCls = isEmerald ? 'text-emerald-400' : 'text-ember';
  const dotCls = isEmerald ? 'bg-emerald-400' : 'bg-ember';

  return (
    <div className={`rounded-2xl border ${borderCls} ${bgCls} p-5`}>
      <div className="flex items-center gap-2.5 mb-4">
        <Icon size={18} strokeWidth={2} className={iconCls} />
        <span className={`eyebrow ${iconCls}`}>{title}</span>
      </div>
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`mt-3.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
            <div className="flex-1">
              <TextInput
                value={it}
                onChange={(v) => onChange(i, v)}
                placeholder={placeholder}
              />
            </div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="mt-2 h-9 w-9 rounded-full text-cream/40 hover:text-ember hover:bg-cream/[0.04] grid place-items-center transition-colors flex-shrink-0"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className={`mt-4 text-xs link-underline ${iconCls}`}
      >
        + Add point
      </button>
    </div>
  );
}
