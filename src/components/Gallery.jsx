import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';

const STATIC = [
  { src: '/images/hero-sunrise.jpg', caption: 'Sunrise rays · Mularahalli · Nov 2025' },
  { src: '/images/ridge-peak.jpg', caption: 'Kudremukh ridgeline at noon' },
  { src: '/images/cliff-summit.jpg', caption: 'Cliff summit emerging from cloud' },
  { src: '/images/forest-stream.jpg', caption: 'Forest stream · Charmadi reserve' },
  { src: '/images/waterfall.jpg', caption: 'Twin waterfalls in monsoon' },
  { src: '/images/green-ridge.jpg', caption: 'Open meadow ridge · Western Ghats' },
  { src: '/images/blue-sky-ridge.jpg', caption: 'Blue-sky day above the treeline' },
  { src: '/images/misty-trees.jpg', caption: 'Misty tea estate · Munnar route' },
  { src: '/images/cta-mist.jpg', caption: 'Cloud spill over the ridge · sunrise' }
];

export default function Gallery() {
  const [shots, setShots] = useState(STATIC);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!supabaseEnabled) return;
    (async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('src, caption, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (!error && data && data.length) {
        setShots(data.map(({ src, caption }) => ({ src, caption })));
      }
    })();
  }, []);

  useEffect(() => {
    document.body.style.overflow = active != null ? 'hidden' : '';
    if (active != null) window.__lenis?.stop();
    else window.__lenis?.start();
    return () => {
      document.body.style.overflow = '';
      window.__lenis?.start();
    };
  }, [active]);

  useEffect(() => {
    if (active == null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + shots.length) % shots.length);
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % shots.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, shots.length]);

  return (
    <section id="gallery" className="bg-cream text-ink py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 lg:mb-20"
        >
          <div>
            <span className="eyebrow text-muted">Gallery</span>
            <h2 className="serif mt-4 text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium">
              Frames from <em className="italic">the field.</em>
            </h2>
          </div>
          <p className="max-w-md text-ink/70 text-[15px] leading-relaxed">
            Photography from our recent expeditions — sunrises, ridgelines, rainforest streams.
            Click any frame to enter fullscreen.
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 lg:gap-6 [column-fill:_balance]">
          {shots.map((s, i) => (
            <motion.button
              key={s.src + i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1], delay: (i % 3) * 0.06 }}
              onClick={() => setActive(i)}
              className="group image-hover relative overflow-hidden rounded-2xl bg-ink/10 mb-4 lg:mb-6 break-inside-avoid w-full block focus:outline-none"
              aria-label={`Open ${s.caption}`}
            >
              <img src={s.src} alt={s.caption} loading="lazy" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 ring-1 ring-ember/0 group-hover:ring-ember/40 transition duration-500 rounded-2xl pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-left">
                <span className="eyebrow text-cream/90">{s.caption}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active != null && (
          <Lightbox
            shots={shots}
            index={active}
            onClose={() => setActive(null)}
            onPrev={() => setActive((i) => (i - 1 + shots.length) % shots.length)}
            onNext={() => setActive((i) => (i + 1) % shots.length)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Lightbox({ shots, index, onClose, onPrev, onNext }) {
  const s = shots[index];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[120] bg-base/95 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close gallery"
        className="absolute top-5 right-5 h-12 w-12 rounded-full bg-cream/10 text-cream hover:bg-ember hover:text-cream grid place-items-center transition-colors z-10"
      >
        <X size={20} />
      </button>

      <button
        onClick={onPrev}
        aria-label="Previous photo"
        className="absolute top-1/2 -translate-y-1/2 left-3 lg:left-8 h-12 w-12 rounded-full bg-cream/10 text-cream hover:bg-ember grid place-items-center transition-colors z-10"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={onNext}
        aria-label="Next photo"
        className="absolute top-1/2 -translate-y-1/2 right-3 lg:right-8 h-12 w-12 rounded-full bg-cream/10 text-cream hover:bg-ember grid place-items-center transition-colors z-10"
      >
        <ChevronRight size={22} />
      </button>

      <div className="h-full w-full flex flex-col items-center justify-center px-4 py-16">
        <motion.img
          key={s.src}
          src={s.src}
          alt={s.caption}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
        />
        <motion.div
          key={s.caption}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <div className="eyebrow text-cream/60">{`${index + 1} / ${shots.length}`}</div>
          <div className="serif text-xl text-cream mt-2">{s.caption}</div>
        </motion.div>
      </div>
    </motion.div>
  );
}
