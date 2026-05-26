import { useTable, EditorShell, LiveBadge, EmptyState } from './_shared.jsx';

export default function BookingsView() {
  const { rows, loading } = useTable('bookings', { order: 'created_at', ascending: false, limit: 50 });

  return (
    <EditorShell
      title="Recent Bookings"
      subtitle="Latest 50 enquiries from your booking form. Real-time — new bookings appear instantly."
      action={<LiveBadge />}
    >
      {loading && <div className="text-cream/40 text-sm">Loading…</div>}
      {!loading && rows.length === 0 && (
        <EmptyState>No bookings yet. They'll show up here the moment a guest submits one.</EmptyState>
      )}
      {!loading && rows.length > 0 && (
        <div className="rounded-2xl border border-cream/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/[0.04] text-left">
              <tr>
                <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">When</th>
                <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Trek</th>
                <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">People</th>
                <th className="px-4 py-3 text-cream/55 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-t border-cream/5 hover:bg-cream/[0.02]">
                  <td className="px-4 py-3 text-xs text-cream/55 whitespace-nowrap">{new Date(b.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-cream">{b.trek_id}</td>
                  <td className="px-4 py-3 text-cream">{b.full_name}</td>
                  <td className="px-4 py-3 text-cream/85">{b.phone}</td>
                  <td className="px-4 py-3 text-cream/75">{b.trek_date || '—'}</td>
                  <td className="px-4 py-3 text-cream/75">{b.party_size}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest bg-cream/10 text-cream/85">{b.status || 'new'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </EditorShell>
  );
}
