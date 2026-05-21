import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tags = [
  'Kudremukh Expedition',
  'Kumara Parvatha Challenge',
  'Netravati Escape',
  'Bandaje Falls Adventure',
  'Kurinjal Peak Trek',
  'Kodachadri Journey',
  'Skandagiri Sunrise',
  'Tadiandamol Expedition'
];

const VIDEO_SRC = '/tags-background.mp4';
const POSTER_SRC = '/images/hero-sunrise.jpg';

export default function RotatingTags() {
  const [i, setI] = useState(0);
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % tags.length), 2800);
    return () => clearInterval(id);
  }, []);

  // If the browser can't play this codec (e.g. HEVC on Chrome/Win), fall back to poster
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onError = () => setVideoOk(false);
    const checkPlayable = () => {
      // readyState 0 + no progress means decode failed silently
      window.setTimeout(() => {
        if (v && v.readyState === 0 && !v.error) {
          // Still nothing after 2s — likely an unplayable codec
          setVideoOk(false);
        }
      }, 2200);
    };
    v.addEventListener('error', onError);
    v.addEventListener('loadstart', checkPlayable);
    return () => {
      v.removeEventListener('error', onError);
      v.removeEventListener('loadstart', checkPlayable);
    };
  }, []);

  return (
    <section
      className="relative bg-base text-cream py-24 lg:py-36 overflow-hidden border-y border-cream/5"
      aria-label="Featured expeditions"
    >
      {videoOk ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={POSTER_SRC}
          aria-hidden
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      ) : (
        <img
          src={POSTER_SRC}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-base/55" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-base/85 via-base/20 to-base/85" aria-hidden />

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
              key={tags[i]}
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
              <em className="italic font-normal text-ember">{tags[i].split(' ')[0]}</em>
              <span className="text-cream"> {tags[i].split(' ').slice(1).join(' ')}</span>
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2 lg:gap-3">
          {tags.map((t, idx) => (
            <button
              key={t}
              onClick={() => setI(idx)}
              aria-label={`Show ${t}`}
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
