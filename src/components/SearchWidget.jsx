import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import { INDIA_DESTINATIONS, INTL_DESTINATIONS } from '../lib/destinations.js';

// Which suggestion list each text field uses
const LIST_FOR = { destination: 'india-destinations', country: 'intl-destinations', city: 'intl-destinations' };

// Static fallback — mirrors the trip_categories seed. Admin edits in DB win.
const FALLBACK_CATS = [
  { cat_key: 'trekking',      label: 'Trekking',            emoji: '🏔' },
  { cat_key: 'sightseeing',   label: 'Sightseeing',         emoji: '🌄' },
  { cat_key: 'camping',       label: 'Camping',             emoji: '🏕' },
  { cat_key: 'beach',         label: 'Beach Trips',         emoji: '🏖' },
  { cat_key: 'weekend',       label: 'Weekend Getaways',    emoji: '🚌' },
  { cat_key: 'backpacking',   label: 'Backpacking',         emoji: '🎒' },
  { cat_key: 'holiday',       label: 'Holiday Packages',    emoji: '🧳' },
  { cat_key: 'international', label: 'International Trips', emoji: '🌏' },
  { cat_key: 'couple',        label: 'Couple Packages',     emoji: '❤️' },
  { cat_key: 'family',        label: 'Family Packages',     emoji: '👨‍👩‍👧' },
  { cat_key: 'college',       label: 'College Trips',       emoji: '🎓' },
  { cat_key: 'corporate',     label: 'Corporate Trips',     emoji: '🏢' },
  { cat_key: 'pilgrimage',    label: 'Pilgrimage Tours',    emoji: '🛕' },
  { cat_key: 'oneday',        label: 'One Day Trips',       emoji: '🚐' },
  { cat_key: 'custom',        label: 'Custom Trip Planner', emoji: '✨' }
];

const BUDGETS = ['Under ₹3,000', '₹3,000–₹5,000', '₹5,000–₹10,000', '₹10,000–₹25,000', '₹25,000+'];
const FOOD = ['Veg', 'Non-Veg', 'Both', 'Jain'];
const STAY = ['Homestay', 'Camping / Tent', 'Hotel', 'Resort', 'Any'];

// Per-category smart fields. Types: text | date | month | number | select
const CONFIGS = {
  trekking: [
    { k: 'destination', label: 'Destination', type: 'text', ph: 'Kudremukh, Netravati…' },
    { k: 'start_date', label: 'Travel Date', type: 'date' },
    { k: 'difficulty', label: 'Difficulty', type: 'select', options: ['Any', 'Easy', 'Moderate', 'Difficult', 'Tough'] },
    { k: 'duration', label: 'Duration', type: 'select', options: ['Any', '1 Day', '2 Days', '3+ Days'] },
    { k: 'budget', label: 'Budget', type: 'select', options: BUDGETS },
    { k: 'people', label: 'People', type: 'number' },
    { k: 'food_pref', label: 'Food', type: 'select', options: FOOD }
  ],
  sightseeing: [
    { k: 'destination', label: 'Destination', type: 'text', ph: 'Coorg, Chikmagalur…' },
    { k: 'start_date', label: 'Travel Date', type: 'date' },
    { k: 'transport', label: 'Transport', type: 'select', options: ['Any', 'Tempo Traveller', 'Mini Bus', 'Car', 'Own vehicle'] },
    { k: 'guide', label: 'Guide Required', type: 'select', options: ['Yes', 'No'] },
    { k: 'budget', label: 'Budget', type: 'select', options: BUDGETS },
    { k: 'people', label: 'People', type: 'number' }
  ],
  international: [
    { k: 'country', label: 'Country', type: 'text', ph: 'Nepal, Thailand, Bali…' },
    { k: 'city', label: 'City', type: 'text', ph: 'Kathmandu, Phuket…' },
    { k: 'month', label: 'Travel Month', type: 'month' },
    { k: 'budget', label: 'Budget', type: 'select', options: ['₹25,000–₹50,000', '₹50,000–₹1L', '₹1L+'] },
    { k: 'people', label: 'Travellers', type: 'number' },
    { k: 'passport', label: 'Passport Ready', type: 'select', options: ['Yes', 'No', 'Applied'] }
  ],
  holiday: [
    { k: 'destination', label: 'Destination', type: 'text', ph: 'Manali, Wayanad, Goa…' },
    { k: 'start_date', label: 'Start Date', type: 'date' },
    { k: 'end_date', label: 'End Date', type: 'date' },
    { k: 'adults', label: 'Adults', type: 'number' },
    { k: 'children', label: 'Children', type: 'number' },
    { k: 'budget', label: 'Budget', type: 'select', options: BUDGETS },
    { k: 'food_pref', label: 'Food', type: 'select', options: FOOD },
    { k: 'stay_type', label: 'Stay Type', type: 'select', options: STAY }
  ],
  custom: [
    { k: 'destination', label: 'Destination', type: 'text', ph: 'Anywhere you dream of' },
    { k: 'people', label: 'People', type: 'number' },
    { k: 'budget', label: 'Budget', type: 'select', options: BUDGETS },
    { k: 'food_pref', label: 'Food', type: 'select', options: FOOD },
    { k: 'stay_type', label: 'Stay', type: 'select', options: STAY },
    { k: 'activities', label: 'Activities', type: 'text', ph: 'Trek, rafting, campfire…' },
    { k: 'special_request', label: 'Special Request', type: 'text', ph: 'Anything else?' }
  ],
  _default: [
    { k: 'destination', label: 'Destination', type: 'text', ph: 'Where to?' },
    { k: 'start_date', label: 'Travel Date', type: 'date' },
    { k: 'people', label: 'People', type: 'number' },
    { k: 'budget', label: 'Budget', type: 'select', options: BUDGETS }
  ]
};

const CTA = {
  trekking: 'Search Treks', sightseeing: 'Find Sightseeing', international: 'Plan International Trip',
  holiday: 'Build My Package', custom: 'Plan My Custom Trip', _default: 'Get My Trip Plan'
};

export default function SearchWidget() {
  const [cats, setCats] = useState(FALLBACK_CATS);
  const [active, setActive] = useState('trekking');
  const [values, setValues] = useState({});

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    supabase
      .from('trip_categories')
      .select('cat_key, label, emoji')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.length) {
          setCats(data);
          if (!data.some((c) => c.cat_key === 'trekking')) setActive(data[0].cat_key);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const fields = CONFIGS[active] || CONFIGS._default;
  const activeCat = cats.find((c) => c.cat_key === active);

  function pick(key) {
    setActive(key);
    setValues({});
  }

  function submit(e) {
    e.preventDefault();
    // Normalize into the planner's shape, then hand off to the
    // "Start Planning" section which captures name + phone and saves.
    const v = values;
    const detail = {
      category: activeCat?.label || active,
      destination: [v.country, v.city, v.destination].filter(Boolean).join(', ') || null,
      start_date: v.start_date || null,
      end_date: v.end_date || null,
      people: Number(v.people || 0) + Number(v.adults || 0) + Number(v.children || 0) || null,
      budget: v.budget || null,
      food_pref: v.food_pref || null,
      stay_type: v.stay_type || null,
      transport: v.transport || null,
      activities: v.activities || null,
      special_request: [
        v.special_request,
        v.guide ? `Guide: ${v.guide}` : null,
        v.passport ? `Passport: ${v.passport}` : null,
        v.month ? `Travel month: ${v.month}` : null,
        v.duration && v.duration !== 'Any' ? `Duration: ${v.duration}` : null,
        v.difficulty && v.difficulty !== 'Any' ? `Difficulty: ${v.difficulty}` : null
      ].filter(Boolean).join(' · ') || null
    };
    window.dispatchEvent(new CustomEvent('anth:plan-prefill', { detail }));
    const target = document.getElementById('plan');
    if (target) {
      if (window.__lenis?.scrollTo) window.__lenis.scrollTo(target, { offset: -60, duration: 1.2 });
      else target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const inputCls =
    'w-full h-12 bg-cream/[0.05] border border-cream/15 rounded-xl px-3.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-ember focus:bg-cream/[0.08] transition-colors [color-scheme:dark]';

  return (
    <section id="search" className="relative z-20 bg-base">
      {/* Shared suggestion lists (MakeMyTrip-style destination dropdowns) */}
      <datalist id="india-destinations">
        {INDIA_DESTINATIONS.map((d) => <option key={d} value={d} />)}
      </datalist>
      <datalist id="intl-destinations">
        {INTL_DESTINATIONS.map((d) => <option key={d} value={d} />)}
      </datalist>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 -mt-14 sm:-mt-20 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
          className="rounded-2xl sm:rounded-3xl border border-cream/12 bg-ink/90 backdrop-blur-2xl shadow-[0_40px_90px_-25px_rgba(0,0,0,0.75)] overflow-hidden"
        >
          {/* Category tabs — hidden scrollbar + right fade hint */}
          <div className="relative border-b border-cream/10">
            <div className="flex gap-1 overflow-x-auto scrollbar-none px-3 py-3 pr-14" role="tablist" aria-label="Trip categories">
              {cats.map((c) => (
                <button
                  key={c.cat_key}
                  role="tab"
                  aria-selected={active === c.cat_key}
                  onClick={() => pick(c.cat_key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                    active === c.cat_key
                      ? 'bg-ember text-cream shadow-lg shadow-ember/25'
                      : 'text-cream/60 hover:text-cream hover:bg-cream/[0.06] border border-transparent hover:border-cream/10'
                  }`}
                >
                  <span aria-hidden>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-ink/95 to-transparent" aria-hidden />
          </div>

          <form onSubmit={submit} className="p-5 sm:p-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {fields.map((f) => (
                <label key={f.k} className="block">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-cream/50 mb-2">{f.label}</span>
                  {f.type === 'select' ? (
                    <select
                      value={values[f.k] || ''}
                      onChange={(e) => setValues({ ...values, [f.k]: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">Any</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      min={f.type === 'number' ? 1 : undefined}
                      list={f.type === 'text' ? LIST_FOR[f.k] : undefined}
                      value={values[f.k] || ''}
                      onChange={(e) => setValues({ ...values, [f.k]: e.target.value })}
                      placeholder={f.ph}
                      className={inputCls}
                    />
                  )}
                </label>
              ))}
              <div className="flex items-end col-span-2 sm:col-span-1">
                <button
                  type="submit"
                  className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-ember text-cream px-5 text-sm font-semibold hover:bg-cream hover:text-ink transition-colors shadow-lg shadow-ember/25"
                >
                  <Search size={15} strokeWidth={2.4} />
                  {CTA[active] || CTA._default}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
