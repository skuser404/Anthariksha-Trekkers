import { motion } from 'framer-motion';

const shots = [
  { src: '/images/hero-sunrise.jpg', alt: 'Sunrise god-rays over Western Ghats', tall: true },
  { src: '/images/blue-sky-ridge.jpg', alt: 'Open meadow under blue sky' },
  { src: '/images/forest-stream.jpg', alt: 'Forest stream through rainforest', tall: true },
  { src: '/images/ridge-peak.jpg', alt: 'Lone ridge peak under clouds' },
  { src: '/images/cliff-summit.jpg', alt: 'Cliff summit emerging from clouds' },
  { src: '/images/waterfall.jpg', alt: 'Twin waterfalls in monsoon' }
];

const ease = [0.7, 0, 0.2, 1];

export default function Journal() {
  return (
    <section id="journal" className="bg-cream text-ink py-24 lg:py-36">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 lg:mb-20">
          <div>
            <span className="eyebrow text-muted">Field Notes</span>
            <h2 className="serif mt-4 text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium">
              Moments from <em className="italic">the trail.</em>
            </h2>
          </div>
          <p className="max-w-sm text-ink/70 text-[15px] leading-relaxed">
            Unedited frames from our recent expeditions across the Ghats. Mist, moss, granite, and the in-between.
          </p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 lg:gap-6 [column-fill:_balance]">
          {shots.map((s, i) => (
            <motion.figure
              key={s.src + i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease, delay: (i % 3) * 0.08 }}
              className="image-hover relative overflow-hidden rounded-2xl bg-ink/10 mb-4 lg:mb-6 break-inside-avoid"
            >
              <img
                src={s.src}
                alt={s.alt}
                loading="lazy"
                className={`w-full h-auto object-cover ${s.tall ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/55 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500">
                <span className="eyebrow text-cream/90">{s.alt}</span>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
