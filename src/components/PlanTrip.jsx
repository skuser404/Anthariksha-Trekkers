import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, CheckCircle2 } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';

const WA_PHONE = '919902704361';
const EMPTY = {
  category: '', destination: '', start_date: '', end_date: '', people: '',
  budget: '', food_pref: '', stay_type: '', transport: '', activities: '',
  special_request: '', full_name: '', phone: ''
};

export default function PlanTrip() {
  const [form, setForm] = useState(EMPTY);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  // Prefill from the search widget
  useEffect(() => {
    const onPrefill = (e) => {
      const d = e.detail || {};
      setDone(false);
      setForm((f) => ({
        ...f,
        ...Object.fromEntries(Object.entries(d).filter(([, v]) => v != null && v !== '')),
        people: d.people ? String(d.people) : f.people
      }));
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    };
    window.addEventListener('anth:plan-prefill', onPrefill);
    return () => window.removeEventListener('anth:plan-prefill', onPrefill);
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const name = form.full_name.trim();
    const phone = form.phone.trim();
    if (name.length < 2) return setErr('Please enter your name.');
    if (phone.replace(/\D/g, '').length < 7) return setErr('Please enter a valid phone number.');
    setErr(null);
    setBusy(true);

    const row = {
      category: form.category || 'Custom Trip',
      destination: form.destination.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      people: Number(form.people) || null,
      budget: form.budget || null,
      food_pref: form.food_pref || null,
      stay_type: form.stay_type || null,
      transport: form.transport || null,
      activities: form.activities.trim() || null,
      special_request: form.special_request.trim() || null,
      full_name: name,
      phone
    };

    if (supabaseEnabled) {
      const { error } = await supabase.from('planning_requests').insert(row);
      if (error) console.warn('[plan] save failed:', error.message);
    }
    setBusy(false);
    setDone(true);
  }

  function whatsappNow() {
    const lines = [
      `Hey Anthariksha! I just sent a trip planning request.`,
      '',
      `Name: ${form.full_name}`,
      `Category: ${form.category || 'Custom Trip'}`,
      form.destination && `Destination: ${form.destination}`,
      form.start_date && `Dates: ${form.start_date}${form.end_date ? ' → ' + form.end_date : ''}`,
      form.people && `People: ${form.people}`,
      form.budget && `Budget: ${form.budget}`
    ].filter(Boolean);
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  }

  const inputCls =
    'w-full bg-cream/[0.05] border border-cream/15 rounded-xl px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-ember transition-colors [color-scheme:dark]';
  const L = ({ label, children, span }) => (
    <label className={`block ${span || ''}`}>
      <span className="block text-[10px] uppercase tracking-[0.18em] text-cream/55 mb-1.5">{label}</span>
      {children}
    </label>
  );

  return (
    <section id="plan" className="bg-base text-cream py-24 lg:py-32 border-t border-cream/5">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          <span className="eyebrow text-ember inline-flex items-center gap-2"><Sparkles size={13} /> Custom Trips</span>
          <h2 className="serif mt-4 text-4xl md:text-5xl lg:text-6xl tracking-tight font-medium">
            Start planning your <em className="italic text-ember">dream trip</em>
          </h2>
          <p className="mt-4 text-cream/55 text-sm max-w-lg mx-auto">
            Tell us what you're imagining — we design the route, stay, food, and price, and reply on WhatsApp within 24 hours.
          </p>
        </motion.div>

        {done ? (
          <div className="max-w-lg mx-auto text-center rounded-3xl border border-moss/30 bg-moss/10 p-10">
            <CheckCircle2 className="mx-auto text-moss" size={40} />
            <h3 className="serif text-2xl mt-4">Request received!</h3>
            <p className="text-cream/65 text-sm mt-2">
              We'll get back to you on WhatsApp within 24 hours with a full plan and pricing.
            </p>
            <button
              onClick={whatsappNow}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ember text-cream px-6 py-3 text-sm font-medium hover:bg-cream hover:text-ink transition-colors"
            >
              <MessageCircle size={16} /> Chat with us now
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className={`rounded-3xl border p-6 sm:p-10 transition-all duration-500 ${
              flash ? 'border-ember ring-2 ring-ember/40 bg-ember/[0.04]' : 'border-cream/12 bg-cream/[0.03]'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <L label="Trip type">
                <input value={form.category} onChange={set('category')} placeholder="Trekking, Family trip…" className={inputCls} />
              </L>
              <L label="Destination">
                <input list="india-destinations" value={form.destination} onChange={set('destination')} placeholder="Kudremukh, Manali, Bali…" className={inputCls} />
              </L>
              <L label="People">
                <input type="number" min={1} value={form.people} onChange={set('people')} placeholder="4" className={inputCls} />
              </L>
              <L label="Start date">
                <input type="date" value={form.start_date} onChange={set('start_date')} className={inputCls} />
              </L>
              <L label="End date">
                <input type="date" value={form.end_date} onChange={set('end_date')} className={inputCls} />
              </L>
              <L label="Budget (per person)">
                <select value={form.budget} onChange={set('budget')} className={inputCls}>
                  <option value="">Select…</option>
                  {['Under ₹3,000', '₹3,000–₹5,000', '₹5,000–₹10,000', '₹10,000–₹25,000', '₹25,000+'].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </L>
              <L label="Food preference">
                <select value={form.food_pref} onChange={set('food_pref')} className={inputCls}>
                  <option value="">Any</option>
                  {['Veg', 'Non-Veg', 'Both', 'Jain'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </L>
              <L label="Stay">
                <select value={form.stay_type} onChange={set('stay_type')} className={inputCls}>
                  <option value="">Any</option>
                  {['Homestay', 'Camping / Tent', 'Hotel', 'Resort'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </L>
              <L label="Transport">
                <select value={form.transport} onChange={set('transport')} className={inputCls}>
                  <option value="">Any</option>
                  {['Tempo Traveller', 'Mini Bus', 'Car', 'Own vehicle'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </L>
              <L label="Activities" span="sm:col-span-2 lg:col-span-3">
                <input value={form.activities} onChange={set('activities')} placeholder="Trekking, rafting, campfire, temple visits…" className={inputCls} />
              </L>
              <L label="Special request" span="sm:col-span-2 lg:col-span-3">
                <textarea rows={2} value={form.special_request} onChange={set('special_request')} placeholder="Birthdays, dietary needs, photography, senior citizens…" className={`${inputCls} resize-none`} />
              </L>
              <L label="Your name *">
                <input required minLength={2} maxLength={80} value={form.full_name} onChange={set('full_name')} placeholder="Full name" autoComplete="name" className={inputCls} />
              </L>
              <L label="Phone / WhatsApp *">
                <input
                  required type="tel" maxLength={20} value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+\-() ]/g, '') })}
                  placeholder="+91 …" autoComplete="tel" className={inputCls}
                />
              </L>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ember text-cream px-6 py-2.5 text-sm font-semibold hover:bg-cream hover:text-ink transition-colors disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Send my trip request'}
                </button>
              </div>
            </div>
            {err && <div className="mt-4 text-sm text-ember">{err}</div>}
            <p className="mt-4 text-[11px] text-cream/40">
              No payment now. Your request goes straight to our team — we reply with itinerary, dates, and pricing (with-food / without-food options).
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
