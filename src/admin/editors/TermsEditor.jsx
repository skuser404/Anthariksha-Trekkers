import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTable, EditorShell, LiveBadge, Field, TextInput, TextArea, Toggle, Button, toast } from './_shared.jsx';

const KINDS = [
  { value: 'terms',        label: 'Terms & Conditions' },
  { value: 'privacy',      label: 'Privacy Policy' },
  { value: 'cancellation', label: 'Cancellation Policy' },
  { value: 'refund',       label: 'Refund Policy' },
  { value: 'safety',       label: 'Safety Guidelines' }
];

export default function TermsEditor() {
  const { rows, loading } = useTable('terms_documents', { order: 'kind', ascending: true });
  const [selectedKind, setSelectedKind] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load draft when kind picked
  useEffect(() => {
    if (!selectedKind) return;
    const existing = rows.find((r) => r.kind === selectedKind);
    if (existing) {
      setDraft({ ...existing });
    } else {
      const tpl = KINDS.find((k) => k.value === selectedKind);
      setDraft({
        kind: selectedKind,
        title: tpl?.label || selectedKind,
        body: '# ' + (tpl?.label || selectedKind) + '\n\nWrite your policy here. Markdown supported.',
        is_published: true
      });
    }
  }, [selectedKind, rows]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    const payload = {
      kind: draft.kind,
      title: draft.title,
      body: draft.body,
      is_published: !!draft.is_published,
      updated_at: new Date().toISOString()
    };
    let error;
    if (draft.id) ({ error } = await supabase.from('terms_documents').update(payload).eq('id', draft.id));
    else ({ error } = await supabase.from('terms_documents').upsert(payload, { onConflict: 'kind' }));
    setSaving(false);
    if (error) return toast(error.message, 'error');
    toast(`${payload.title} ${draft.is_published ? 'published' : 'saved as draft'}`);
    setSelectedKind(null);
    setDraft(null);
  }

  if (!selectedKind) {
    return (
      <EditorShell
        title="Terms & Conditions"
        subtitle="Publish and edit your policy documents. Markdown supported in the body."
        action={<LiveBadge />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {KINDS.map((k) => {
            const existing = rows.find((r) => r.kind === k.value);
            return (
              <button
                key={k.value}
                onClick={() => setSelectedKind(k.value)}
                className="text-left rounded-2xl p-5 bg-cream/[0.03] border border-cream/10 hover:border-ember/40 transition-colors"
              >
                <div className="eyebrow text-ember">{k.value}</div>
                <div className="serif text-xl mt-2">{k.label}</div>
                <div className="mt-3 text-xs text-cream/55">
                  {existing
                    ? `Last updated ${new Date(existing.updated_at).toLocaleDateString()} · ${existing.is_published ? 'Published' : 'Draft'}`
                    : 'Not yet created'}
                </div>
                <div className="mt-4 text-xs text-ember">Open editor →</div>
              </button>
            );
          })}
        </div>
        {loading && <div className="mt-6 text-cream/40 text-sm">Loading…</div>}
      </EditorShell>
    );
  }

  return (
    <EditorShell
      title={draft?.title || 'Editor'}
      subtitle="Markdown supported · # for headings, - for bullets, **bold**, *italic*."
      action={
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button variant="ghost" onClick={() => { setSelectedKind(null); setDraft(null); }}>← Back</Button>
          <Button onClick={save} loading={saving}>Save</Button>
        </div>
      }
    >
      {draft && (
        <div className="space-y-5">
          <Field label="Document title">
            <TextInput value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
          </Field>
          <Field label="Body — markdown">
            <TextArea rows={22} value={draft.body} onChange={(v) => setDraft({ ...draft, body: v })} />
          </Field>
          <Toggle
            checked={draft.is_published}
            onChange={(v) => setDraft({ ...draft, is_published: v })}
            label={draft.is_published ? 'Published — visible to the public' : 'Draft — hidden'}
          />
        </div>
      )}
    </EditorShell>
  );
}
