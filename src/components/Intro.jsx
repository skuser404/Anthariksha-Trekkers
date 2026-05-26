import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const ease = [0.7, 0, 0.2, 1];

export default function Intro() {
  return (
    <section className="bg-cream text-ink py-28 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease }}
          className="lg:col-span-8"
        >
          <span className="eyebrow text-muted">About the Studio</span>
          <h2 className="serif mt-8 text-xl md:text-2xl lg:text-[1.55rem] xl:text-[1.7rem] leading-[1.35] tracking-tight font-light text-ink/85 max-w-xl">
            We don't sell trips. We design weekends in the wild — for people who chase fog,
            ridgelines, and the kind of sunrise you <em className="italic text-ember">remember</em>, not the one you post.
          </h2>

          <motion.figure
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.1, ease, delay: 0.3 }}
            className="mt-12 lg:mt-16 image-hover relative overflow-hidden rounded-2xl aspect-[16/10] max-w-2xl"
          >
            <img
              src="/images/ridge-peak.jpg"
              alt="Kudremukh ridgeline rising above the clouds"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
            <figcaption className="absolute bottom-4 left-5 eyebrow text-cream/85">
              Kudremukh ridge · Nov 2025
            </figcaption>
          </motion.figure>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease, delay: 0.2 }}
          className="lg:col-span-4 lg:pt-32"
        >
          <div className="h-px w-12 bg-ink mb-6" />
          <p className="text-base lg:text-[17px] leading-relaxed text-ink/80">
            Anthariksha Trekkers is a Bangalore-based trekking collective leading curated adventures across Karnataka's Western Ghats since day one. Big batches. Trek leads on every climb. Real wilderness.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6">
            <Counter to={12} suffix="+" label="Ghats Routes" />
            <Counter to={25} suffix="+" label="Trek Leaders" glow />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Counter({ to, suffix = '', label, glow = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.floor(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setN(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <div ref={ref}>
      <motion.div
        className="serif text-4xl text-ember"
        animate={
          glow && inView
            ? {
                textShadow: [
                  '0 0 0px rgba(210,119,46,0)',
                  '0 0 24px rgba(210,119,46,0.35)',
                  '0 0 0px rgba(210,119,46,0)'
                ]
              }
            : {}
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {n.toLocaleString('en-IN')}{suffix}
      </motion.div>
      <div className="eyebrow text-muted mt-2">{label}</div>
    </div>
  );
}
