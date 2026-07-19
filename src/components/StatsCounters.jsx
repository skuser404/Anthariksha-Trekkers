import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 10000, suffix: 'K+', display: 10, label: 'Happy Trekkers' },
  { value: 500, suffix: '+', display: 500, label: 'Successful Expeditions' },
  { value: 28, suffix: '+', display: 28, label: 'Trekking Destinations' },
  { value: 20000, suffix: 'K+', display: 20, label: 'Memories Captured' }
];

function Counter({ display, suffix, label, started }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!started) return;
    let raf;
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(display * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, display]);

  return (
    <div className="text-center">
      <div className="serif text-4xl sm:text-5xl lg:text-6xl font-medium text-cream tracking-tight">
        {n}{suffix}
      </div>
      <div className="mt-2 eyebrow text-cream/50">{label}</div>
    </div>
  );
}

export default function StatsCounters() {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-base text-cream py-16 lg:py-24 border-t border-cream/5">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {STATS.map((s) => (
            <Counter key={s.label} display={s.display} suffix={s.suffix} label={s.label} started={started} />
          ))}
        </div>
        <div className="mt-10 text-center eyebrow text-ember">— Since 2024 —</div>
      </div>
    </section>
  );
}
