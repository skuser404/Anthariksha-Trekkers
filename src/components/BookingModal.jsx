import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import { formatINR } from '../lib/treks.js';

const WA_PHONE = '919902704361';
const OPEN_EVENT = 'anth:open-booking';

/**
 * Open the booking popup from anywhere:
 *   openBooking({ id: 'kudremukh', name: 'Kudremukh Trek', price: 4499 })
 */
export function openBooking(trek) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: trek }));
}

const EMPTY = { name: '', phone: '', date: '', people: '2', pickup: '', notes: '' };

export default function BookingModal() {
  const [trek, setTrek] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const onOpen = (e) => {
      setForm(EMPTY);
      setErr(null);
      setTrek(e.detail || null);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!trek) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setTrek(null); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [trek]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (name.length < 2) return setErr('Please enter your name.');
    if (phone.replace(/\D/g, '').length < 7) return setErr('Please enter a valid phone number.');
    setErr(null);

    // Best-effort: save the enquiry so it shows in the admin panel.
    // Fire-and-forget — WhatsApp must open synchronously (popup blockers).
    if (supabaseEnabled) {
      supabase.from('bookings').insert({
        trek_id: trek.id,
        full_name: name,
        phone,
        trek_date: form.date || null,
        party_size: Math.min(60, Math.max(1, Number(form.people) || 1)),
        pickup_location: form.pickup.trim() || null,
        notes: form.notes.trim() || null
      }).then(({ error }) => {
        if (error) console.warn('[booking] save failed:', error.message);
      });
    }

    const lines = [
      `Hey Anthariksha! I'd like to book the ${trek.name}.`,
      '',
      `Name: ${name}`,
      `Contact: ${phone}`,
      `Date: ${form.date || 'Flexible'}`,
      `People: ${form.people || '1'}`,
      `Pickup: ${form.pickup.trim() || 'To be decided'}`
    ];
    if (form.notes.trim()) lines.push(`Notes: ${form.notes.trim()}`);
    if (trek.price != null) lines.push('', `Listed price: ${formatINR(trek.price)} / person`);

    window.open(
      `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank',
      'noopener'
    );
    setTrek(null);
  }

  return (
    <AnimatePresence>
      {trek && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-ink/70 backdrop-blur-sm px-0 sm:px-6"
          onClick={() => setTrek(null)}
        >
          <motion.form
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.7, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-base text-cream rounded-t-3xl sm:rounded-3xl border border-cream/10 p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-ember">Book your slot</div>
                <h3 className="serif text-2xl mt-1">{trek.name}</h3>
                {trek.price != null && (
                  <div className="text-sm text-cream/60 mt-1">{formatINR(trek.price)} / person</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTrek(null)}
                aria-label="Close booking form"
                className="p-2 rounded-full border border-cream/15 text-cream/70 hover:text-cream hover:border-cream/40 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name *" className="sm:col-span-2">
                <input value={form.name} onChange={set('name')} required minLength={2} maxLength={80}
                  placeholder="Your name" autoComplete="name" className={inputCls} />
              </Field>
              <Field label="Phone / WhatsApp *" className="sm:col-span-2">
                <input value={form.phone} onChange={set('phone')} required type="tel" maxLength={20}
                  placeholder="+91 …" autoComplete="tel" className={inputCls} />
              </Field>
              <Field label="Preferred date">
                <input value={form.date} onChange={set('date')} type="date"
                  min={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </Field>
              <Field label="People">
                <input value={form.people} onChange={set('people')} type="number" min={1} max={60}
                  className={inputCls} />
              </Field>
              <Field label="Pickup point in Bangalore" className="sm:col-span-2">
                <input value={form.pickup} onChange={set('pickup')} maxLength={120}
                  placeholder="e.g. Majestic, Silk Board…" className={inputCls} />
              </Field>
              <Field label="Anything else? (optional)" className="sm:col-span-2">
                <textarea value={form.notes} onChange={set('notes')} rows={2} maxLength={500}
                  placeholder="Questions, group details…" className={`${inputCls} resize-none`} />
              </Field>
            </div>

            {err && <div className="mt-4 text-sm text-ember">{err}</div>}

            <button
              type="submit"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-ember text-cream px-6 py-3.5 font-medium hover:bg-cream hover:text-ink transition-colors"
            >
              <MessageCircle size={17} strokeWidth={2} />
              Confirm &amp; continue on WhatsApp
            </button>
            <p className="mt-3 text-[11px] text-cream/45 text-center">
              Your details open in WhatsApp — nothing is paid on this site. We confirm your slot on chat.
            </p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  'w-full bg-cream/[0.04] border border-cream/15 rounded-xl px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-ember transition-colors';

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] uppercase tracking-[0.18em] text-cream/55 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
