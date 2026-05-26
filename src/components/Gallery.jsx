import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import { toDriveImageURL, extractDriveId } from '../lib/drive.js';

function toDriveVideoURL(url) {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

const STATIC = [
  { src: '/images/hero-sunrise.jpg',    caption: 'Sunrise rays · Mularahalli · Nov 2025', category: 'Sunrise',     media_type: 'image' },
  { src: '/images/ridge-peak.jpg',      caption: 'Kudremukh ridgeline at noon',           category: 'Summit View', media_type: 'image' },
  { src: '/images/cliff-summit.jpg',    caption: 'Cliff summit emerging from cloud',      category: 'Summit View', media_type: 'image' },
  { src: '/images/forest-stream.jpg',   caption: 'Forest stream · Charmadi reserve',      category: 'Forest',      media_type: 'image' },
  { src: '/images/waterfall.jpg',       caption: 'Twin waterfalls in monsoon',            category: 'Waterfall',   media_type: 'image' },
  { src: '/images/green-ridge.jpg',     caption: 'Open meadow ridge · Western Ghats',     category: 'Summit View', media_type: 'image' },
  { src: '/images/blue-sky-ridge.jpg',  caption: 'Blue-sky day above the treeline',       category: 'Summit View', media_type: 'image' },
  { src: '/images/misty-trees.jpg',     caption: 'Misty tea estate · Munnar route',       category: 'Forest',      media_type: 'image' },
  { src: '/images/cta-mist.jpg',        caption: 'Cloud spill over the ridge · sunrise',  category: 'Sunrise',     media_type: 'image' }
];

export default function Gallery() {
  const [shots, setShots] = useState(STATIC);
  const [active, setActive] = useState(null);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('src, caption, category, media_type, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (cancelled) return;
      if (!error && data && data.length) {
        setShots(data.map(({ src, caption, category, media_type }) => ({
          src,
          caption,
          category,
          media_type: media_type === 'video' ? 'video' : 'image'
        })));
      }
    }
    load();
    const channel = supabase
      .channel('realtime:gallery_images')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_images' }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    shots.forEach((s) => { if (s.category) set.add(s.category); });
    return ['All', ...Array.from(set)];
  }, [shots]);

  const filtered = category === 'All' ? shots : shots.filter((s) => s.category === category);

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
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + filtered.length) % filtered.length);
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % filtered.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, filtered.length]);

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

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10 lg:mb-12">
            {categories.map((c) => {
              const isActive = category === c;
              const count = c === 'All' ? shots.length : shots.filter((s) => s.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setActive(null); }}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
                    isActive
                      ? 'bg-ink text-cream border-ink shadow-[0_0_20px_rgba(20,25,26,0.18)]'
                      : 'bg-ink/[0.03] text-ink/70 border-ink/15 hover:border-ink/40 hover:bg-ink/[0.06]'
                  }`}
                >
                  <span>{c}</span>
                  <span className={`text-[10px] tracking-widest ${isActive ? 'text-cream/70' : 'text-ink/40'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 lg:gap-6 [column-fill:_balance]">
          {filtered.map((s, i) => (
            <GalleryTile
              key={s.src + i}
              shot={s}
              index={i}
              onOpen={() => setActive(i)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active != null && (
          <Lightbox
            shots={filtered}
            index={active}
            onClose={() => setActive(null)}
            onPrev={() => setActive((i) => (i - 1 + filtered.length) % filtered.length)}
            onNext={() => setActive((i) => (i + 1) % filtered.length)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function GalleryTile({ shot, index, onOpen }) {
  const videoRef = useRef(null);
  const isVideo = shot.media_type === 'video';
  const posterSrc = isVideo ? null : toDriveImageURL(shot.src);

  return (
    <motion.button
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1], delay: (index % 3) * 0.06 }}
      onClick={onOpen}
      onMouseEnter={() => { if (isVideo) videoRef.current?.play().catch(() => {}); }}
      onMouseLeave={() => { if (isVideo) videoRef.current?.pause(); }}
      className="group image-hover relative overflow-hidden rounded-2xl bg-ink/10 mb-4 lg:mb-6 break-inside-avoid w-full block focus:outline-none"
      aria-label={`Open ${shot.caption}`}
    >
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={toDriveVideoURL(shot.src)}
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-auto object-cover aspect-[4/5]"
          />
          <div className="absolute inset-0 grid place-items-center pointer-events-none opacity-90 group-hover:opacity-0 transition-opacity duration-300">
            <span className="h-14 w-14 rounded-full bg-base/65 backdrop-blur-sm grid place-items-center text-cream shadow-[0_0_24px_rgba(0,0,0,0.5)]">
              <Play size={22} strokeWidth={1.8} />
            </span>
          </div>
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-ember/85 text-cream">
            ▶ Video
          </span>
        </>
      ) : (
        <img src={posterSrc} alt={shot.caption} loading="lazy" className="w-full h-auto object-cover" />
      )}
      <div className="absolute inset-0 ring-1 ring-ember/0 group-hover:ring-ember/40 transition duration-500 rounded-2xl pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-left">
        <span className="eyebrow text-cream/90">{shot.caption}</span>
      </div>
    </motion.button>
  );
}

function Lightbox({ shots, index, onClose, onPrev, onNext }) {
  const s = shots[index];
  const isVideo = s.media_type === 'video';

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
        aria-label="Previous item"
        className="absolute top-1/2 -translate-y-1/2 left-3 lg:left-8 h-12 w-12 rounded-full bg-cream/10 text-cream hover:bg-ember grid place-items-center transition-colors z-10"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={onNext}
        aria-label="Next item"
        className="absolute top-1/2 -translate-y-1/2 right-3 lg:right-8 h-12 w-12 rounded-full bg-cream/10 text-cream hover:bg-ember grid place-items-center transition-colors z-10"
      >
        <ChevronRight size={22} />
      </button>

      <div className="h-full w-full flex flex-col items-center justify-center px-4 py-16">
        {isVideo ? (
          <motion.video
            key={s.src}
            src={toDriveVideoURL(s.src)}
            controls
            autoPlay
            playsInline
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
            className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-[0_30px_120px_rgba(0,0,0,0.7)] bg-black"
          />
        ) : (
          <motion.img
            key={s.src}
            src={toDriveImageURL(s.src)}
            alt={s.caption}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
          />
        )}
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
