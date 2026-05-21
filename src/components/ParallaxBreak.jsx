import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function ParallaxBreak() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

  return (
    <section ref={ref} className="relative h-[90vh] lg:h-[110vh] w-full overflow-hidden bg-base">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          poster="https://www.genspark.ai/api/files/s/yUjxQrgJ"
        >
          <source src="/green_hilltop.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
          className="serif text-cream text-center text-3xl md:text-5xl lg:text-6xl xl:text-7xl max-w-5xl leading-[1.1] tracking-tight font-medium"
        >
          "The mountain doesn't care who you are.<br />
          <em className="italic text-ember">It only asks if you'll show up.</em>"
        </motion.h2>
      </div>
    </section>
  );
}
