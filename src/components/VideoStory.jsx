import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROTATION_MS = 6000;
const POSTER_SRC = '/images/cliff-summit.jpg';

const TREKS = [
  { name: 'Kudremukh Trek',          video: '/Kudremukh Trek.mp4',          caption: 'Where the ridge meets the sky.' },
  { name: 'Kumara Parvatha Trek',    video: '/Kumara Parvatha Trek.mp4',    caption: 'The second-highest peak in Karnataka.' },
  { name: 'Netravati Peak Trek',     video: '/Netravati Peak Trek.mp4',     caption: 'Where clouds spill over the cliff.' },
  { name: 'Bandaje Falls Trek',      video: '/Bandaje Falls Trek.mp4',      caption: 'A 200-foot drop into the wild.' },
  { name: 'Kurinjal Peak Trek',      video: '/Kurinjal Peak Trek.mp4',      caption: 'The quieter ridge of Kudremukh.' },
  { name: 'Kodachadri Trek',         video: '/Kodachadri Trek.mp4',         caption: 'Sunset peak of the Sahyadris.' },
  { name: 'Skandagiri Sunrise Trek', video: '/Skandagiri Sunrise TreK.mp4', caption: 'Sunrise above the clouds.' },
  { name: 'Tadiandamol Trek',        video: '/Tadiandamol Trek.mp4',        caption: 'Coorg’s highest peak.' }
];

function shouldShowVideo() {
  if (typeof window === 'undefined') return false;
  const conn = navigator.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /^(slow-2g|2g|3g)$/.test(conn.effectiveType)) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

export default function VideoStory() {
  const [i, setI] = useState(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [videoEnabled] = useState(shouldShowVideo);
  const refA = useRef(null);
  const refB = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setI((v) => (v + 1) % TREKS.length);
      if (videoEnabled) setActiveSlot((s) => (s === 0 ? 1 : 0));
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [videoEnabled]);

  // Initial — slot A = current, slot B = next
  useEffect(() => {
    if (!videoEnabled) return;
    if (refA.current && !refA.current.dataset.src) {
      refA.current.dataset.src = TREKS[0].video;
      refA.current.src = TREKS[0].video;
      refA.current.play?.().catch(() => {});
    }
    if (refB.current && !refB.current.dataset.src) {
      refB.current.dataset.src = TREKS[1].video;
      refB.current.src = TREKS[1].video;
      refB.current.play?.().catch(() => {});
    }
  }, [videoEnabled]);

  // Defer next-clip preload until after the crossfade completes
  useEffect(() => {
    if (!videoEnabled) return;
    const hiddenRef = activeSlot === 0 ? refB : refA;
    const nextIdx = (i + 1) % TREKS.length;
    const nextSrc = TREKS[nextIdx].video;

    const timer = setTimeout(() => {
      const v = hiddenRef.current;
      if (!v || v.dataset.src === nextSrc) return;
      v.dataset.src = nextSrc;
      v.src = nextSrc;
      v.load();
      v.play?.().catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [i, activeSlot, videoEnabled]);

  const trek = TREKS[i];

  return (
    <section className="relative w-full bg-base text-cream overflow-hidden">
      <div className="relative h-[80vh] lg:h-[100vh] w-full">
        {/* Poster fallback under videos */}
        <img
          src={POSTER_SRC}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />

        {videoEnabled && (
          <>
            <video
              ref={refA}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-out will-change-[opacity] ${
                activeSlot === 0 ? 'opacity-100 z-[2]' : 'opacity-0 z-[1] pointer-events-none'
              }`}
            />
            <video
              ref={refB}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-out will-change-[opacity] ${
                activeSlot === 1 ? 'opacity-100 z-[2]' : 'opacity-0 z-[1] pointer-events-none'
              }`}
            />
          </>
        )}

        {/* Cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70 z-[3]" aria-hidden />

        {/* Trek name + caption overlay */}
        <div className="relative z-[4] h-full flex flex-col items-center justify-center text-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={trek.name}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(6px)' }}
              transition={{ duration: 0.95, ease: [0.7, 0, 0.2, 1] }}
              className="max-w-5xl"
            >
              <div className="eyebrow text-cream/80 mb-6 tracking-[0.28em]">
                ✦ Now Showing
              </div>
              <h2 className="serif text-5xl md:text-7xl lg:text-[6.5rem] tracking-tight font-medium leading-[1.05] drop-shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
                <em className="italic font-normal text-ember">{trek.name.split(' ')[0]}</em>
                <span className="text-cream"> {trek.name.split(' ').slice(1).join(' ')}</span>
              </h2>
              <p className="mt-8 text-base sm:text-lg text-cream/85 tracking-wide max-w-2xl mx-auto leading-relaxed">
                {trek.caption}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="absolute bottom-10 lg:bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {TREKS.map((t, idx) => (
              <span
                key={t.name}
                className={`h-1 rounded-full transition-all duration-700 ${
                  idx === i ? 'w-10 bg-ember' : 'w-2 bg-cream/30'
                }`}
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
