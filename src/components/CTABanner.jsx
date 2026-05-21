import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function CTABanner() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section ref={ref} id="contact" className="relative h-[90vh] lg:h-[100vh] w-full overflow-hidden bg-base">
      <motion.div style={{ y }} className="absolute inset-0 scale-110">
        <img
          src="/images/cta-mist.jpg"
          alt="Misty Western Ghats ridge at sunrise"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="eyebrow text-cream/70 mb-8"
        >
          ✦ Let's Get You On A Trail
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }}
          className="serif text-cream text-5xl md:text-7xl lg:text-[9vw] xl:text-[8rem] leading-[1] tracking-tight font-medium max-w-6xl"
        >
          Your next ridge<br />
          <em className="italic text-ember">is calling.</em>
        </motion.h2>
        <motion.a
          href="https://wa.me/919902704361"
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="btn-pill btn-solid mt-12"
        >
          Talk to us on WhatsApp <span className="arrow">→</span>
        </motion.a>
      </div>
    </section>
  );
}
