import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Utensils, ShieldAlert } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';

const DEFAULTS = {
  intro_note: 'Empty lunch boxes are mandatory for trekking. Only Tupperware or steel lunch boxes are allowed — disposable or recyclable food containers are strictly NOT allowed.',
  dos: [
    'Wear proper trekking shoes with strong grip',
    'Keep your raincoat or poncho ready at all times',
    'Follow trek lead and guide instructions carefully',
    'Maintain team spirit and support fellow trekkers',
    'Respect nature — take memories and leave only footprints',
    'Carry enough water and personal essentials',
    'Keep your belongings safe and packed properly'
  ],
  donts: [
    'Do not litter trails, campsites, or homestays',
    'Avoid plastic bottles, disposable cups, and plastic waste',
    'Do not leave the trekking group without informing the guide',
    'No loud music during trek or campsite experience',
    'Alcohol, smoking, and prohibited substances are strictly banned',
    'Do not damage plants, rocks, or natural surroundings'
  ]
};

export default function TrekGuidelines() {
  const [data, setData] = useState(DEFAULTS);

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;

    async function load() {
      const { data: row, error } = await supabase
        .from('trek_guidelines')
        .select('intro_note, dos, donts')
        .eq('id', 1)
        .maybeSingle();
      if (cancelled || error || !row) return;
      setData({
        intro_note: row.intro_note || DEFAULTS.intro_note,
        dos: Array.isArray(row.dos) && row.dos.length ? row.dos : DEFAULTS.dos,
        donts: Array.isArray(row.donts) && row.donts.length ? row.donts : DEFAULTS.donts
      });
    }

    load();
    const channel = supabase
      .channel('realtime:trek_guidelines')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trek_guidelines' }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted flex items-center gap-2">
        <ShieldAlert size={12} /> Important Trek Guidelines
      </span>

      {data.intro_note && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="mt-5 rounded-2xl border border-ember/30 bg-ember/[0.08] backdrop-blur-sm px-5 py-4 flex items-start gap-4 shadow-[0_0_30px_rgba(210,119,46,0.08)]"
        >
          <div className="h-10 w-10 rounded-full bg-ember/15 text-ember grid place-items-center flex-shrink-0">
            <Utensils size={16} strokeWidth={1.8} />
          </div>
          <p className="text-[14px] text-ink/85 leading-relaxed">{data.intro_note}</p>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GuidelineCard
          kind="do"
          title="Do's"
          items={data.dos}
        />
        <GuidelineCard
          kind="dont"
          title="Don'ts"
          items={data.donts}
        />
      </div>
    </section>
  );
}

function GuidelineCard({ kind, title, items }) {
  const isDo = kind === 'do';
  const Icon = isDo ? CheckCircle2 : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
      className={`rounded-2xl border backdrop-blur-sm px-5 py-5 ${
        isDo
          ? 'border-emerald-500/30 bg-emerald-500/[0.05] shadow-[0_0_30px_rgba(16,185,129,0.06)]'
          : 'border-ember/35 bg-ember/[0.05] shadow-[0_0_30px_rgba(210,119,46,0.06)]'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <Icon
          size={18}
          strokeWidth={2}
          className={isDo ? 'text-emerald-600' : 'text-ember'}
        />
        <span className={`eyebrow ${isDo ? 'text-emerald-700' : 'text-ember'}`}>{title}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <motion.li
            key={it + i}
            initial={{ opacity: 0, x: isDo ? -8 : 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 + i * 0.04, duration: 0.4 }}
            className="flex gap-3 text-[14px] text-ink/85 leading-relaxed"
          >
            <span className={`mt-2 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              isDo ? 'bg-emerald-500' : 'bg-ember'
            }`} />
            <span>{it}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
