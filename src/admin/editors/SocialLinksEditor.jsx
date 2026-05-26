import { useState } from 'react';
import { Instagram, Youtube, Facebook, Linkedin, Phone, Mail, Globe, MessageCircle, MapPin, Twitter } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { useTable, EditorShell, LiveBadge, Field, TextInput, Select, Toggle, Button, EmptyState, toast } from './_shared.jsx';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram',       icon: Instagram,    color: 'text-pink-400' },
  { value: 'youtube',   label: 'YouTube',         icon: Youtube,      color: 'text-red-400' },
  { value: 'whatsapp',  label: 'WhatsApp',        icon: MessageCircle,color: 'text-green-400' },
  { value: 'facebook',  label: 'Facebook',        icon: Facebook,     color: 'text-blue-400' },
  { value: 'linkedin',  label: 'LinkedIn',        icon: Linkedin,     color: 'text-sky-400' },
  { value: 'twitter',   label: 'X (Twitter)',     icon: Twitter,      color: 'text-cream/85' },
  { value: 'phone',     label: 'Phone',           icon: Phone,        color: 'text-ember' },
  { value: 'email',     label: 'Email',           icon: Mail,         color: 'text-ember' },
  { value: 'google',    label: 'Google Business', icon: MapPin,       color: 'text-emerald-400' },
  { value: 'website',   label: 'Website',         icon: Globe,        color: 'text-cream/85' }
];

function platformIcon(value) {
  return PLATFORMS.find((p) => p.value === value) || { icon: Globe, color: 'text-cream/85', label: value };
}

const EMPTY = { platform: 'instagram', label: '', url: '', handle: '', is_active: true, display_order: 100 };

export default function SocialLinksEditor() {
  const { rows, loading } = useTable('social_links', { order: 'display_order' });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload = { ...draft, display_order: Number(draft.display_order) || 100, updated_at: new Date().toISOString() };
    if (!payload.url.trim() || !payload.platform) {
      setSaving(false);
      return toast('Platform and URL are required', 'error');
    }

    const timeoutId = setTimeout(() => {
      console.warn('[social] save timeout');
      setSaving(false);
      toast('Save timed out — check connection', 'error');
    }, 10000);

    try {
      let error;
      if (draft.id) ({ error } = await supabase.from('social_links').update(payload).eq('id', draft.id));
      else ({ error } = await supabase.from('social_links').insert(payload));
      if (error) { toast(error.message, 'error'); return; }
      toast(`${draft.platform} link saved`);
      setDraft(null);
    } catch (e) {
      console.warn('[social] save threw', e);
      toast(e?.message || 'Save failed', 'error');
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Remove this link?')) return;
    await supabase.from('social_links').delete().eq('id', id);
  }

  async function toggleActive(row) {
    await supabase.from('social_links').update({ is_active: !row.is_active }).eq('id', row.id);
  }

  return (
    <EditorShell
      title="Social Media Links"
      subtitle="Edit the links shown in the footer and floating contact button. Active links show on the public site."
      previewHref="/#contact"
      action={
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button onClick={() => setDraft({ ...EMPTY })}>+ Add Link</Button>
        </div>
      }
    >
      {loading && <div className="text-cream/40 text-sm">Loading…</div>}
      {!loading && rows.length === 0 && <EmptyState>No links yet. Click <strong>+ Add Link</strong>.</EmptyState>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((l) => {
          const meta = platformIcon(l.platform);
          const Icon = meta.icon;
          return (
            <div key={l.id} className={`rounded-2xl p-5 bg-cream/[0.03] border border-cream/10 ${!l.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-full bg-cream/10 grid place-items-center ${meta.color}`}>
                    <Icon size={18} strokeWidth={1.6} />
                  </div>
                  <div>
                    <div className="eyebrow text-cream/55">{l.platform}</div>
                    <div className="serif text-lg mt-0.5">{l.label || l.handle || meta.label}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest ${l.is_active ? 'bg-moss/15 text-moss' : 'bg-cream/5 text-cream/40'}`}>
                  {l.is_active ? 'Live' : 'Hidden'}
                </span>
              </div>
              <div className="mt-3 text-xs text-cream/55 truncate">{l.handle}</div>
              <a href={l.url} target="_blank" rel="noreferrer" className="mt-1 text-xs text-cream/75 break-all link-underline block">
                {l.url}
              </a>
              <div className="mt-5 flex items-center gap-3 text-xs">
                <button onClick={() => setDraft(l)} className="link-underline">Edit</button>
                <button onClick={() => toggleActive(l)} className="link-underline text-cream/70">{l.is_active ? 'Hide' : 'Show'}</button>
                <button onClick={() => remove(l.id)} className="link-underline text-ember">Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-md p-6">
          <div className="w-full max-w-lg rounded-2xl bg-base border border-cream/15 p-6 lg:p-8 shadow-2xl">
            <h3 className="serif text-2xl mb-6">{draft.id ? 'Edit link' : 'Add link'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Platform">
                <Select value={draft.platform} onChange={(v) => setDraft({ ...draft, platform: v })} options={PLATFORMS} />
              </Field>
              <Field label="Order">
                <TextInput type="number" value={draft.display_order} onChange={(v) => setDraft({ ...draft, display_order: v })} />
              </Field>
              <Field label="Display name" className="sm:col-span-2">
                <TextInput value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} placeholder="Instagram" />
              </Field>
              <Field label="Handle" className="sm:col-span-2">
                <TextInput value={draft.handle} onChange={(v) => setDraft({ ...draft, handle: v })} placeholder="@anthariksha_trekkers" />
              </Field>
              <Field label="URL" className="sm:col-span-2">
                <TextInput value={draft.url} onChange={(v) => setDraft({ ...draft, url: v })} placeholder="https://www.instagram.com/anthariksha_trekkers/" />
              </Field>
              <Field label="Active" className="sm:col-span-2">
                <Toggle checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} label={draft.is_active ? 'Visible on site' : 'Hidden'} />
              </Field>
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
