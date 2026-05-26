import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROTATION_MS = 6000;
const POSTER_SRC = '/images/waterfall.jpg';

const TREKS = [
  { name: 'Kudremukh Trek',          video: '/Kudremukh Trek.mp4'        },
  { name: 'Kumara Parvatha Trek',    video: '/Kumara Parvatha Trek.mp4'  },
  { name: 'Netravati Peak Trek',     video: '/Netravati Peak Trek.mp4'   },
  { name: 'Bandaje Falls Trek',      video: '/Bandaje Falls Trek.mp4'    },
  { name: 'Kurinjal Peak Trek',      video: '/Kurinjal Peak Trek.mp4'    },
  { name: 'Kodachadri Trek',         video: '/Kodachadri Trek.mp4'       },
  { name: 'Skandagiri Sunrise Trek', video: '/Skandagiri Sunrise TreK.mp4' },
  { name: 'Tadiandamol Trek',        video: '/Tadiandamol Trek.mp4'      }
];

// On low-power / mobile devices, prefer poster only to avoid jank.
function shouldShowVideo() {
  if (typeof window === 'undefined') return false;
  const conn = navigator.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /^(slow-2g|2g|3g)$/.test(conn.effectiveType)) return false;
  // Reduce motion preference
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

export default function RotatingTags() {
  const [i, setI] = useState(0);
  const [activeSlot, setActiveSlot] = useState(0); // 0 = A visible, 1 = B visible
  const [videoEnabled] = useState(shouldShowVideo);
  const refA = useRef(null);
  const refB = useRef(null);

  // Advance every ROTATION_MS — title + active slot together
  useEffect(() => {
    if (!videoEnabled) {
      // Even with video disabled, still rotate the title every interval
      const id = setInterval(() => setI((v) => (v + 1) % TREKS.length), ROTATION_MS);
      return () => clearInterval(id);
    }
    const id = setInterval(() => {
      setI((v) => (v + 1) % TREKS.length);
      setActiveSlot((s) => (s === 0 ? 1 : 0));
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [videoEnabled]);

  // Preload the NEXT clip into the now-hidden slot — but DEFER until the
  // crossfade is fully complete, otherwise the half-faded element flashes
  // its loading frame in the middle of the screen.
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
    }, 1500); // > 1200ms crossfade — slot is fully invisible by then

    return () => clearTimeout(timer);
  }, [i, activeSlot, videoEnabled]);

  // Initial load — put current into slot A, next into slot B
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

  return (
    <section
      className="relative bg-base text-cream py-24 lg:py-36 overflow-hidden border-y border-cream/5"
      aria-label="Featured expeditions"
    >
      {/* Poster fallback — always under the videos, fills any loading gap */}
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
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-out will-change-[opacity] ${
              activeSlot === 0 ? 'opacity-100 z-[2]' : 'opacity-0 z-[1] pointer-events-none'
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
          />
          <video
            ref={refB}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-out will-change-[opacity] ${
              activeSlot === 1 ? 'opacity-100 z-[2]' : 'opacity-0 z-[1] pointer-events-none'
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
          />
        </>
      )}

      <div className="absolute inset-0 bg-base/35" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-base/70 via-transparent to-base/80" aria-hidden />

      <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[820px] rounded-full bg-ember/25 blur-[160px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="eyebrow text-cream/75"
        >
          ✦ Pick Your Next
        </motion.span>

        <div className="mt-6 lg:mt-10 h-[18vw] sm:h-[120px] lg:h-[180px] grid place-items-center relative">
          <AnimatePresence mode="wait">
            <motion.h2
              key={TREKS[i].name}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                textShadow: [
                  '0 0 0px rgba(210,119,46,0)',
                  '0 0 30px rgba(210,119,46,0.55)',
                  '0 0 80px rgba(210,119,46,0.35)',
                  '0 0 30px rgba(210,119,46,0.55)'
                ]
              }}
              exit={{ opacity: 0, y: -40, filter: 'blur(8px)' }}
              transition={{
                duration: 0.9,
                ease: [0.7, 0, 0.2, 1],
                textShadow: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="serif text-[10vw] sm:text-6xl lg:text-7xl xl:text-[6.5rem] font-medium tracking-tight leading-none drop-shadow-[0_6px_30px_rgba(0,0,0,0.45)]"
            >
              <em className="italic font-normal text-ember">{TREKS[i].name.split(' ')[0]}</em>
              <span className="text-cream"> {TREKS[i].name.split(' ').slice(1).join(' ')}</span>
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2 lg:gap-3">
          {TREKS.map((t, idx) => (
            <button
              key={t.name}
              onClick={() => {
                setI(idx);
                setActiveSlot((s) => (s === 0 ? 1 : 0));
              }}
              aria-label={`Show ${t.name}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === i ? 'w-12 bg-ember' : 'w-3 bg-cream/25 hover:bg-cream/50'
              }`}
            />
          ))}
        </div>

        <a
          href="#treks"
          className="btn-pill mt-12 inline-flex border-cream/30 text-cream"
        >
          Browse All Expeditions <span className="arrow">→</span>
        </a>
      </div>
    </section>
  );
}
