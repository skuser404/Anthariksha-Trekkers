import { supabase } from '../../lib/supabase.js';
import { useTable, EditorShell, LiveBadge, Select, toast } from './_shared.jsx';

const STATUS_OPTIONS = [
  { value: 'new', label: '🆕 New' },
  { value: 'replied', label: '💬 Replied' },
  { value: 'closed', label: '✅ Closed' }
];

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

export default function PlanningRequestsView() {
  const { rows, loading, reload } = useTable('planning_requests', { order: 'created_at', ascending: false, limit: 100 });

  async function setStatus(r, status) {
    const { error } = await supabase.from('planning_requests').update({ status }).eq('id', r.id);
    if (error) return toast(error.message, 'error');
    toast(`${r.full_name} → ${status}`);
    reload();
  }

  function waReply(r) {
    const lines = [
      `Hi ${r.full_name}! Anthariksha Trekkers here 👋`,
      `About your ${r.category || 'trip'} request${r.destination ? ` for ${r.destination}` : ''} — here's what we suggest:`,
      '',
      '• Package cost: ₹____ / person (with food) · ₹____ (without food)',
      '• Dates available: ____',
      '• Itinerary: ____'
    ];
    window.open(
      `https://wa.me/${r.phone.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank', 'noopener'
    );
  }

  return (
    <EditorShell
      title="Planning Requests"
      subtitle="Custom trip requests from the search widget and the Start Planning form. Reply on WhatsApp with pricing + itinerary."
      action={<LiveBadge />}
    >
      {loading && <div className="py-10 text-cream/40 text-center">Loading…</div>}
      {!loading && !rows.length && (
        <div className="py-10 text-cream/40 text-center">
          No requests yet. They'll appear here the moment a visitor submits the planner.
        </div>
      )}
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className={`rounded-2xl border p-5 ${r.status === 'new' ? 'border-ember/40 bg-ember/[0.04]' : 'border-cream/10 bg-cream/[0.02]'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium text-cream">
                  {r.full_name}
                  <span className="ml-2 text-xs text-cream/50">{r.phone}{r.email ? ` · ${r.email}` : ''}</span>
                </div>
                <div className="mt-1 text-xs text-cream/45">
                  {new Date(r.created_at).toLocaleString('en-IN')} · {r.category || 'Custom'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => waReply(r)}
                  className="text-xs rounded-full bg-ember text-cream px-3.5 py-1.5 font-medium hover:bg-cream hover:text-ink transition-colors"
                >Reply on WhatsApp</button>
                <div className="w-32">
                  <Select value={r.status} onChange={(v) => setStatus(r, v)} options={STATUS_OPTIONS} />
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-cream/70">
              {r.destination && <div><span className="text-cream/40">Destination:</span> {r.destination}</div>}
              {(r.start_date || r.end_date) && <div><span className="text-cream/40">Dates:</span> {[fmt(r.start_date), fmt(r.end_date)].filter(Boolean).join(' → ')}</div>}
              {r.people && <div><span className="text-cream/40">People:</span> {r.people}</div>}
              {r.budget && <div><span className="text-cream/40">Budget:</span> {r.budget}</div>}
              {r.food_pref && <div><span className="text-cream/40">Food:</span> {r.food_pref}</div>}
              {r.stay_type && <div><span className="text-cream/40">Stay:</span> {r.stay_type}</div>}
              {r.transport && <div><span className="text-cream/40">Transport:</span> {r.transport}</div>}
              {r.activities && <div className="col-span-2"><span className="text-cream/40">Activities:</span> {r.activities}</div>}
            </div>
            {r.special_request && (
              <div className="mt-2 text-xs text-cream/60 border-t border-cream/10 pt-2">
                <span className="text-cream/40">Request:</span> {r.special_request}
              </div>
            )}
          </div>
        ))}
      </div>
    </EditorShell>
  );
}
