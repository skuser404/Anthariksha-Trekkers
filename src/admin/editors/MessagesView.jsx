import { supabase } from '../../lib/supabase.js';
import { useTable, EditorShell, LiveBadge, Select, toast } from './_shared.jsx';

const STATUS_OPTIONS = [
  { value: 'new', label: '🆕 New' },
  { value: 'replied', label: '💬 Replied' },
  { value: 'closed', label: '✅ Closed' }
];

export default function MessagesView() {
  const { rows, loading, reload } = useTable('contact_messages', { order: 'created_at', ascending: false, limit: 100 });

  async function setStatus(m, status) {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', m.id);
    if (error) return toast(error.message, 'error');
    toast(`${m.full_name} → ${status}`);
    reload();
  }

  return (
    <EditorShell
      title="Contact Messages"
      subtitle="Messages from the website's contact form."
      action={<LiveBadge />}
    >
      {loading && <div className="py-10 text-cream/40 text-center">Loading…</div>}
      {!loading && !rows.length && (
        <div className="py-10 text-cream/40 text-center">No messages yet.</div>
      )}
      <div className="space-y-4">
        {rows.map((m) => (
          <div key={m.id} className={`rounded-2xl border p-5 ${m.status === 'new' ? 'border-ember/40 bg-ember/[0.04]' : 'border-cream/10 bg-cream/[0.02]'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium text-cream">
                  {m.full_name}
                  <span className="ml-2 text-xs text-cream/50">{[m.phone, m.email].filter(Boolean).join(' · ')}</span>
                </div>
                {m.subject && <div className="mt-1 text-sm text-cream/80">{m.subject}</div>}
                <div className="mt-1 text-xs text-cream/45">{new Date(m.created_at).toLocaleString('en-IN')}</div>
              </div>
              <div className="flex items-center gap-2">
                {m.phone && (
                  <a
                    href={`https://wa.me/${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${m.full_name}! Anthariksha Trekkers here — about your message: "${(m.subject || m.message).slice(0, 60)}"…`)}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs rounded-full bg-ember text-cream px-3.5 py-1.5 font-medium hover:bg-cream hover:text-ink transition-colors"
                  >Reply on WhatsApp</a>
                )}
                <div className="w-32">
                  <Select value={m.status} onChange={(v) => setStatus(m, v)} options={STATUS_OPTIONS} />
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-cream/70 whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>
    </EditorShell>
  );
}
