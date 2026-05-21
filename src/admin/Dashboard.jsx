import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { formatINR } from '../lib/treks.js';

export default function AdminDashboard({ user }) {
  const [treks, setTreks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTrek, setEditingTrek] = useState(null);
  const [trekDraft, setTrekDraft] = useState({});
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchDraft, setBatchDraft] = useState(emptyBatchDraft());
  const [saving, setSaving] = useState(false);

  function emptyBatchDraft() {
    return { trek_id: '', start_date: '', end_date: '', price: '', is_active: true, date_label: '' };
  }

  async function load() {
    setLoading(true);
    const [{ data: trekRows }, { data: batchRows }, { data: bookingRows }] = await Promise.all([
      supabase.from('treks').select('*').order('display_order', { ascending: true }),
      supabase.from('batches').select('*').order('start_date', { ascending: true }),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(50)
    ]);
    setTreks(trekRows || []);
    setBatches(batchRows || []);
    setBookings(bookingRows || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startTrekEdit(t) {
    setEditingTrek(t.id);
    setTrekDraft({
      price: t.price,
      is_active: t.is_active,
      is_open: t.is_open !== false,
      tag: t.tag || ''
    });
  }

  async function saveTrekEdit() {
    if (!editingTrek) return;
    setSaving(true);
    const { error } = await supabase
      .from('treks')
      .update({
        price: Number(trekDraft.price) || null,
        is_active: !!trekDraft.is_active,
        is_open: !!trekDraft.is_open,
        tag: trekDraft.tag
      })
      .eq('id', editingTrek);
    setSaving(false);
    if (error) return alert(error.message);
    setEditingTrek(null);
    await load();
  }

  async function quickToggleOpen(t) {
    const nextOpen = !(t.is_open !== false);
    const { error } = await supabase
      .from('treks')
      .update({ is_open: nextOpen })
      .eq('id', t.id);
    if (error) return alert(error.message);
    await load();
  }

  function startBatchEdit(b) {
    setEditingBatch(b.id);
    setBatchDraft({
      trek_id: b.trek_id,
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      price: b.price ?? '',
      is_active: b.is_active,
      date_label: b.date_label || ''
    });
  }

  function startNewBatch() {
    setEditingBatch('new');
    setBatchDraft(emptyBatchDraft());
  }

  async function saveBatch() {
    setSaving(true);
    const payload = {
      trek_id: batchDraft.trek_id,
      start_date: batchDraft.start_date,
      end_date: batchDraft.end_date || null,
      price: batchDraft.price === '' ? null : Number(batchDraft.price),
      is_active: !!batchDraft.is_active,
      date_label: batchDraft.date_label || null
    };

    if (!payload.trek_id || !payload.start_date) {
      setSaving(false);
      return alert('Trek and start date are required.');
    }

    let error;
    if (editingBatch === 'new') {
      ({ error } = await supabase.from('batches').insert(payload));
    } else {
      ({ error } = await supabase.from('batches').update(payload).eq('id', editingBatch));
    }
    setSaving(false);
    if (error) return alert(error.message);
    setEditingBatch(null);
    setBatchDraft(emptyBatchDraft());
    await load();
  }

  async function deleteBatch(id) {
    if (!confirm('Delete this batch?')) return;
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) return alert(error.message);
    await load();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-ink text-cream grid place-items-center text-xs font-bold">A</div>
            <div>
              <div className="eyebrow text-muted">Control Panel</div>
              <div className="text-sm font-medium">{user.email}</div>
            </div>
          </div>
          <button onClick={signOut} className="text-sm link-underline">Sign out</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-14">

        {/* ============ BATCHES ============ */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="serif text-3xl">Upcoming Departures ({batches.length})</h2>
              <p className="text-sm text-muted mt-1">
                These dates show on the homepage. Empty? Site auto-fills next 5 weekends for the featured treks.
              </p>
            </div>
            <button onClick={startNewBatch} className="px-4 py-2 rounded-full bg-ink text-cream text-sm">
              + New Batch
            </button>
          </div>

          {editingBatch && (
            <div className="mb-6 p-5 rounded-2xl bg-mist border border-ink/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                <Field label="Trek">
                  <select
                    value={batchDraft.trek_id}
                    onChange={(e) => setBatchDraft({ ...batchDraft, trek_id: e.target.value })}
                    className="w-full px-3 py-2 border border-ink/20 rounded bg-white"
                  >
                    <option value="">Select…</option>
                    {treks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Start date">
                  <input
                    type="date"
                    value={batchDraft.start_date}
                    onChange={(e) => setBatchDraft({ ...batchDraft, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-ink/20 rounded bg-white"
                  />
                </Field>
                <Field label="End date">
                  <input
                    type="date"
                    value={batchDraft.end_date}
                    onChange={(e) => setBatchDraft({ ...batchDraft, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-ink/20 rounded bg-white"
                  />
                </Field>
                <Field label="Price (₹)">
                  <input
                    type="number"
                    placeholder="Trek default"
                    value={batchDraft.price}
                    onChange={(e) => setBatchDraft({ ...batchDraft, price: e.target.value })}
                    className="w-full px-3 py-2 border border-ink/20 rounded bg-white"
                  />
                </Field>
                <Field label="Date label (optional)">
                  <input
                    type="text"
                    placeholder="Dec 14-15"
                    value={batchDraft.date_label}
                    onChange={(e) => setBatchDraft({ ...batchDraft, date_label: e.target.value })}
                    className="w-full px-3 py-2 border border-ink/20 rounded bg-white"
                  />
                </Field>
                <Field label="Active">
                  <label className="inline-flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={!!batchDraft.is_active}
                      onChange={(e) => setBatchDraft({ ...batchDraft, is_active: e.target.checked })}
                    />
                    <span className="text-sm">Show on site</span>
                  </label>
                </Field>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={saveBatch} disabled={saving} className="px-4 py-2 rounded-full bg-ink text-cream text-sm">
                  {saving ? 'Saving…' : editingBatch === 'new' ? 'Create batch' : 'Save changes'}
                </button>
                <button onClick={() => { setEditingBatch(null); setBatchDraft(emptyBatchDraft()); }} className="px-4 py-2 rounded-full border border-ink/20 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-ink/10">
            <table className="w-full text-sm">
              <thead className="bg-ink/5 text-left">
                <tr>
                  <th className="px-4 py-3">Trek</th>
                  <th className="px-4 py-3">Date range</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-muted text-center">
                    No batches yet. Run <code>schema_v3_batches.sql</code> to bootstrap, or click <strong>+ New Batch</strong>.
                  </td></tr>
                )}
                {batches.map((b) => (
                  <tr key={b.id} className="border-t border-ink/5">
                    <td className="px-4 py-3 font-medium">{b.trek_label || b.trek_id}</td>
                    <td className="px-4 py-3 text-ink/80">{b.start_date}{b.end_date ? ` → ${b.end_date}` : ''}</td>
                    <td className="px-4 py-3 text-ink/60">{b.date_label || '—'}</td>
                    <td className="px-4 py-3 font-medium">{b.price != null ? formatINR(b.price) : <span className="text-muted">trek default</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-moss/20 text-ink' : 'bg-ink/10 text-muted'}`}>
                        {b.is_active ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-3">
                        <button onClick={() => startBatchEdit(b)} className="text-xs link-underline">Edit</button>
                        <button onClick={() => deleteBatch(b.id)} className="text-xs link-underline text-ember">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ TREKS ============ */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="serif text-3xl">Treks ({treks.length})</h2>
            <span className="text-xs text-muted">Edit price, active state, and tag line.</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-ink/10">
            <table className="w-full text-sm">
              <thead className="bg-ink/5 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td className="px-4 py-6 text-muted" colSpan={7}>Loading…</td></tr>
                )}
                {!loading && treks.map((t) => {
                  const isEditing = editingTrek === t.id;
                  const isOpen = t.is_open !== false;
                  return (
                    <tr key={t.id} className="border-t border-ink/5">
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted">{t.id}</div>
                      </td>
                      <td className="px-4 py-3">{t.difficulty}</td>
                      <td className="px-4 py-3">{t.duration}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={trekDraft.price ?? ''}
                            onChange={(e) => setTrekDraft({ ...trekDraft, price: e.target.value })}
                            className="w-28 px-2 py-1 border border-ink/20 rounded"
                          />
                        ) : (
                          <span className="font-medium">{formatINR(t.price)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!trekDraft.is_open}
                              onChange={(e) => setTrekDraft({ ...trekDraft, is_open: e.target.checked })}
                            />
                            <span className="text-xs">{trekDraft.is_open ? 'Open' : 'Closed'}</span>
                          </label>
                        ) : (
                          <button
                            onClick={() => quickToggleOpen(t)}
                            title="Click to toggle"
                            className={`text-xs px-2.5 py-1 rounded-full border transition ${
                              isOpen
                                ? 'bg-moss/20 text-ink border-moss/40 hover:bg-moss/30'
                                : 'bg-ink/10 text-muted border-ink/15 hover:bg-ink/15'
                            }`}
                          >
                            {isOpen ? '● Open' : '○ Closed'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={!!trekDraft.is_active}
                            onChange={(e) => setTrekDraft({ ...trekDraft, is_active: e.target.checked })}
                          />
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? 'bg-moss/20 text-ink' : 'bg-ink/10 text-muted'}`}>
                            {t.is_active ? 'Live' : 'Hidden'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="inline-flex gap-2">
                            <button onClick={saveTrekEdit} disabled={saving} className="px-3 py-1 rounded-full bg-ink text-cream text-xs">
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingTrek(null)} className="px-3 py-1 rounded-full border border-ink/20 text-xs">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startTrekEdit(t)} className="text-xs link-underline">Edit</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ BOOKINGS ============ */}
        <section>
          <h2 className="serif text-3xl mb-6">Recent bookings ({bookings.length})</h2>
          <div className="rounded-2xl border border-ink/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink/5 text-left">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Trek</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">People</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr><td className="px-4 py-6 text-muted" colSpan={6}>No bookings yet.</td></tr>
                )}
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-ink/5">
                    <td className="px-4 py-3 text-xs text-muted">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{b.trek_id}</td>
                    <td className="px-4 py-3">{b.full_name}</td>
                    <td className="px-4 py-3">{b.phone}</td>
                    <td className="px-4 py-3">{b.trek_date}</td>
                    <td className="px-4 py-3">{b.party_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}
