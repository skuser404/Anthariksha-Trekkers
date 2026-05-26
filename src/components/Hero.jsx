import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const POSTER = '/images/hero-sunrise.jpg';
const ease = [0.7, 0, 0.2, 1];

export default function Hero() {
  const sectionRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });

  const bgX = useTransform(sx, [0, 1], ['-3%', '3%']);
  const bgY = useTransform(sy, [0, 1], ['-3%', '3%']);

  const tiltX = useTransform(sy, [0, 1], [4, -4]);
  const tiltY = useTransform(sx, [0, 1], [-6, 6]);

  const spotX = useTransform(sx, (v) => `${v * 100}%`);
  const spotY = useTransform(sy, (v) => `${v * 100}%`);

  useEffect(() => {
    const m = window.matchMedia('(min-width: 1025px)');
    const onChange = () => setIsDesktop(m.matches);
    onChange();
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isDesktop || !sectionRef.current) return;
    const el = sectionRef.current;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      mx.set(Math.min(Math.max(x, 0), 1));
      my.set(Math.min(Math.max(y, 0), 1));
    };
    const onLeave = () => {
      mx.set(0.5);
      my.set(0.5);
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [isDesktop, mx, my]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] w-full overflow-hidden bg-base"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute inset-[-4%]"
      >
        <img
          src={POSTER}
          alt="Sunrise over the Western Ghats"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>

      <motion.div
        style={{
          background: useTransform(
            [spotX, spotY],
            ([x, y]) =>
              `radial-gradient(420px circle at ${x} ${y}, rgba(210,119,46,0.18), transparent 60%)`
          )
        }}
        className="absolute inset-0 z-[2] pointer-events-none mix-blend-screen"
        aria-hidden
      />

      <div className="absolute inset-0 z-[3] bg-gradient-to-b from-black/55 via-black/25 to-black/80" aria-hidden />
      <div className="absolute inset-0 z-[3] bg-gradient-to-r from-black/40 via-transparent to-transparent" aria-hidden />
      <div className="absolute inset-0 z-[4] bg-gradient-to-t from-base via-transparent to-transparent" aria-hidden />

      <Particles />
      <div className="grain animate-grain z-[6]" aria-hidden />

      <div className="relative z-10 h-full flex flex-col justify-end max-w-[1400px] mx-auto px-6 lg:px-10 pb-24 lg:pb-28">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="eyebrow text-cream/80 mb-6 flex items-center gap-3"
        >
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="inline-block text-ember"
          >
            ✦
          </motion.span>
          Western Ghats · Since Day One
        </motion.span>

        <motion.h1
          style={
            isDesktop
              ? { rotateX: tiltX, rotateY: tiltY, transformStyle: 'preserve-3d' }
              : undefined
          }
          className="headline text-cream text-[14vw] sm:text-[10vw] lg:text-[8vw] xl:text-[7.5vw] will-change-transform"
        >
          <Reveal delay={0.2}>Born to Trek.</Reveal>
          <Reveal delay={0.4}>
            Built to{' '}
            <motion.em
              className="italic font-normal text-ember inline-block relative"
              animate={{ textShadow: [
                '0 0 0px rgba(210,119,46,0)',
                '0 0 40px rgba(210,119,46,0.45)',
                '0 0 0px rgba(210,119,46,0)'
              ] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              Explore
            </motion.em>
            .
          </Reveal>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.7 }}
          className="mt-8 max-w-xl text-base lg:text-lg text-cream/85 font-light leading-relaxed"
        >
          Curated weekend treks across the Western Ghats — from Kudremukh to Bandaje. Small groups. Real mountains. Honest stories.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.9 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a href="#treks" className="btn-pill btn-solid">
            Explore Treks <span className="arrow">→</span>
          </a>
          <a
            href="https://wa.me/919902704361"
            target="_blank"
            rel="noreferrer"
            className="btn-pill text-cream"
          >
            WhatsApp Us <span className="arrow">→</span>
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-6 lg:left-10 z-10 eyebrow text-cream/70"
      >
        EST. BANGALORE · WESTERN GHATS
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 right-6 lg:right-10 z-10 flex items-center gap-3 eyebrow text-cream/70"
      >
        <span>Scroll to discover</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={14} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Reveal({ children, delay = 0 }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 1.1, ease, delay }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

function Particles() {
  const dots = Array.from({ length: 14 });
  return (
    <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden" aria-hidden>
      {dots.map((_, i) => {
        const size = 1 + (i % 4);
        const left = (i * 53) % 100;
        const delay = (i * 0.6) % 8;
        const duration = 12 + (i % 6) * 2;
        return (
          <motion.span
            key={i}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '-15%', opacity: [0, 0.6, 0.6, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
            style={{
              left: `${left}%`,
              width: size,
              height: size
            }}
            className="absolute rounded-full bg-cream/70 blur-[0.5px]"
          />
        );
      })}
    </div>
  );
}
