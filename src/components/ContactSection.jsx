import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, MessageCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';

const MAPS_QUERY = encodeURIComponent('Anthariksha Trekkers, Bangalore, Karnataka');
const EMPTY = { full_name: '', phone: '', email: '', subject: '', message: '' };

export default function ContactSection() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return setErr('Please enter your name.');
    if (form.message.trim().length < 5) return setErr('Please write a message.');
    setErr(null);
    setBusy(true);
    if (supabaseEnabled) {
      const { error } = await supabase.from('contact_messages').insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        subject: form.subject.trim() || null,
        message: form.message.trim()
      });
      if (error) console.warn('[contact] save failed:', error.message);
    }
    setBusy(false);
    setDone(true);
  }

  const inputCls =
    'w-full bg-cream/[0.05] border border-cream/15 rounded-xl px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-ember transition-colors';

  return (
    <section id="contact" className="bg-base text-cream py-24 lg:py-32 border-t border-cream/5">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
          className="mb-12"
        >
          <span className="eyebrow text-ember">Contact</span>
          <h2 className="serif mt-4 text-4xl md:text-5xl lg:text-6xl tracking-tight font-medium">
            Talk to a <em className="italic text-ember">real trekker</em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {done ? (
            <div className="rounded-3xl border border-moss/30 bg-moss/10 p-10 text-center self-start">
              <CheckCircle2 className="mx-auto text-moss" size={40} />
              <h3 className="serif text-2xl mt-4">Message sent!</h3>
              <p className="text-cream/65 text-sm mt-2">We usually reply within a few hours on WhatsApp or email.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-3xl border border-cream/12 bg-cream/[0.03] p-6 sm:p-8 self-start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required minLength={2} maxLength={80} value={form.full_name} onChange={set('full_name')} placeholder="Name *" aria-label="Name" className={inputCls} />
                <input
                  type="tel" maxLength={20} value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+\-() ]/g, '') })}
                  placeholder="Phone" aria-label="Phone" className={inputCls}
                />
                <input type="email" value={form.email} onChange={set('email')} placeholder="Email" aria-label="Email" className={`${inputCls} sm:col-span-2`} />
                <input maxLength={150} value={form.subject} onChange={set('subject')} placeholder="Subject" aria-label="Subject" className={`${inputCls} sm:col-span-2`} />
                <textarea required minLength={5} maxLength={2000} rows={4} value={form.message} onChange={set('message')} placeholder="Your message *" aria-label="Message" className={`${inputCls} sm:col-span-2 resize-none`} />
              </div>
              {err && <div className="mt-3 text-sm text-ember">{err}</div>}
              <button
                type="submit" disabled={busy}
                className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-ember text-cream px-8 py-3 text-sm font-semibold hover:bg-cream hover:text-ink transition-colors disabled:opacity-50"
              >
                {busy ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}

          <div className="rounded-3xl overflow-hidden border border-cream/12 flex flex-col">
            <iframe
              title="Anthariksha Trekkers on Google Maps"
              src={`https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`}
              className="w-full flex-1 min-h-[280px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="p-5 bg-cream/[0.03] flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-cream/70"><MapPin size={15} /> Bangalore, Karnataka</span>
              <span className="flex-1" />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-ember hover:underline"
              >Get Directions <ExternalLink size={13} /></a>
              <a href="tel:+919902704361" className="inline-flex items-center gap-1.5 text-cream/70 hover:text-cream"><Phone size={14} /> Call</a>
              <a href="https://wa.me/919902704361" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cream/70 hover:text-cream"><MessageCircle size={14} /> WhatsApp</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
