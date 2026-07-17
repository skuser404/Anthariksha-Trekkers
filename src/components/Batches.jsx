import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import { TREK_PRICES, formatINR } from '../lib/treks.js';
import { openBooking } from './BookingModal.jsx';

const FEATURED_IDS = ['kudremukh', 'netravati', 'bandaje', 'kurinjal', 'gangadikal', 'kodachadri'];

// Names + IDs in display order — used as fallback when Supabase isn't configured.
const FALLBACK = [
  { trek_id: 'kudremukh',  name: 'Kudremukh',  price: TREK_PRICES.kudremukh,  is_open: true },
  { trek_id: 'netravati',  name: 'Netravati',  price: TREK_PRICES.netravati,  is_open: true },
  { trek_id: 'bandaje',    name: 'Bandaje',    price: TREK_PRICES.bandaje,    is_open: true },
  { trek_id: 'kurinjal',   name: 'Kurinjal',   price: TREK_PRICES.kurinjal,   is_open: true },
  { trek_id: 'gangadikal', name: 'Gangadikal', price: TREK_PRICES.gangadikal, is_open: true },
  { trek_id: 'kodachadri', name: 'Kodachadri', price: TREK_PRICES.kodachadri, is_open: true }
];

export default function Batches() {
  const [rows, setRows] = useState(FALLBACK);
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('treks')
        .select('id, name, price, is_open, is_active')
        .in('id', FEATURED_IDS)
        .eq('is_active', true);

      if (cancelled) return;
      if (!error && data && data.length) {
        const map = Object.fromEntries(data.map((r) => [r.id, r]));
        setRows(
          FEATURED_IDS
            .map((id) => map[id])
            .filter(Boolean)
            .map((r) => ({
              trek_id: r.id,
              name: r.name.replace(/ Trek$/, ''),
              price: r.price ?? TREK_PRICES[r.id],
              is_open: r.is_open !== false
            }))
        );
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <section id="batches" className="bg-base text-cream py-24 lg:py-36 border-t border-cream/5">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 lg:mb-20">
          <div>
            <span className="eyebrow text-cream/60">Weekend Departures</span>
            <h2 className="serif mt-4 text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium">
              Every <em className="italic text-ember">weekend</em>. Open all year.
            </h2>
          </div>
          <p className="text-cream/60 text-sm max-w-xs">
            Friday-night pickup from Bangalore. Sunday-evening return. Transport, stay & meals included.
          </p>
        </div>

        <div className="hidden lg:grid grid-cols-12 gap-4 py-4 border-b border-cream/15 eyebrow text-cream/50">
          <div className="col-span-5">Trek</div>
          <div className="col-span-3">Schedule</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Price</div>
        </div>

        <div>
          {loading && (
            <div className="py-10 text-cream/40 text-sm">Loading…</div>
          )}
          {!loading && rows.map((b, i) => (
            <motion.div
              key={b.trek_id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1], delay: i * 0.05 }}
              className="group grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4 py-6 lg:py-8 border-b border-cream/10 hover:bg-cream/5 transition-colors px-2 lg:px-0"
            >
              <div className="lg:col-span-5 col-span-2">
                <div className="serif text-2xl lg:text-4xl tracking-tight font-medium group-hover:text-ember transition-colors">
                  {b.name}
                </div>
              </div>

              <div className="lg:col-span-3 text-cream/80">
                <div className="eyebrow text-cream/40 lg:hidden mb-1">Schedule</div>
                <span>Every weekend</span>
                <span className="block text-xs text-cream/40 mt-1">Fri night → Sun evening</span>
              </div>

              <div className="lg:col-span-2">
                <div className="eyebrow text-cream/40 lg:hidden mb-1">Status</div>
                <StatusPill open={b.is_open} />
              </div>

              <div className="lg:col-span-2 lg:text-right flex items-center lg:justify-end gap-3">
                <div>
                  <div className="eyebrow text-cream/40 lg:hidden mb-1">Price</div>
                  <span className="font-medium text-cream">{formatINR(b.price)}</span>
                </div>
                {b.is_open ? (
                  <button
                    type="button"
                    onClick={() => openBooking({ id: b.trek_id, name: `${b.name} Trek`, price: b.price })}
                    aria-label={`Book ${b.name}`}
                    className="inline-flex items-center gap-2 rounded-full bg-ember text-cream px-4 py-2 text-xs font-medium hover:bg-cream hover:text-ink transition-colors"
                  >
                    Book →
                  </button>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex items-center gap-2 rounded-full border border-cream/20 text-cream/40 px-4 py-2 text-xs font-medium cursor-not-allowed"
                  >
                    Closed
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-xs text-cream/45">
          Trek status is updated in real time. "Closed" means we've paused this trek for the season (weather, permits, batch full) — message us on WhatsApp to be notified when it reopens.
        </p>
      </div>
    </section>
  );
}

function StatusPill({ open }) {
  if (open) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-moss/15 text-moss text-xs font-medium border border-moss/30">
        <CheckCircle2 size={13} strokeWidth={2.4} />
        Open
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink/30 text-cream/50 text-xs font-medium border border-cream/15">
      <XCircle size={13} strokeWidth={2.4} />
      Closed
    </span>
  );
}
