import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toDriveImageURL } from '../lib/drive.js';

const AUTOPLAY_MS = 4800;
const FALLBACK_SRC = '/images/ridge-peak.jpg';

export default function TrekSlideshow({ images, autoplay = true, className = '' }) {
  const clean = Array.isArray(images) ? images.filter(Boolean) : [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const total = clean.length;
  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(total, 1)), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % Math.max(total, 1)), [total]);

  // Reset on image set change
  useEffect(() => { setIndex(0); }, [total, clean[0]]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || paused || total < 2) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [autoplay, paused, total, next]);

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Preload neighbours
  useEffect(() => {
    if (total < 2) return;
    const ahead = clean[(index + 1) % total];
    const behind = clean[(index - 1 + total) % total];
    [ahead, behind].forEach((src) => {
      if (!src) return;
      const img = new Image();
      img.src = toDriveImageURL(src, 1800);
    });
  }, [index, total, clean]);

  if (total === 0) return null;

  const current = clean[index];

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-ink/10 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        touchStart.current = null;
      }}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={current + index}
          src={toDriveImageURL(current, 1800)}
          alt=""
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_SRC; }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ opacity: { duration: 0.9 }, scale: { duration: 6, ease: 'linear' } }}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </AnimatePresence>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-base/40 backdrop-blur hover:bg-ember text-cream grid place-items-center transition-colors opacity-0 group-hover/slideshow:opacity-100 lg:opacity-70"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-base/40 backdrop-blur hover:bg-ember text-cream grid place-items-center transition-colors opacity-0 group-hover/slideshow:opacity-100 lg:opacity-70"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {clean.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`transition-all rounded-full ${
                  i === index
                    ? 'w-6 h-1.5 bg-cream'
                    : 'w-1.5 h-1.5 bg-cream/45 hover:bg-cream/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
