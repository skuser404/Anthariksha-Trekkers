import { motion } from 'framer-motion';
import { MapPin, Compass } from 'lucide-react';
import { EXPLORE_PLACES } from '../lib/explorePlaces.js';

export default function ExploreAround() {
  const places = EXPLORE_PLACES;

  return (
    <section id="explore-around" className="bg-base text-cream py-24 lg:py-36 border-t border-cream/5">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 lg:mb-20"
        >
          <div>
            <span className="eyebrow text-cream/60 flex items-center gap-2">
              <Compass size={12} /> Explore Around
            </span>
            <h2 className="serif mt-4 text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium">
              Beyond the summit, <em className="italic text-ember">a thousand stops.</em>
            </h2>
          </div>
          <p className="max-w-md text-cream/65 text-[15px] leading-relaxed">
            Temples, tea estates, suspension bridges and waterfalls — places worth stopping for
            on the way to or from every Western Ghats trek.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {places.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1], delay: (i % 3) * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur border border-cream/10 hover:border-ember/40 transition-colors duration-500"
            >
              <div className="relative aspect-[4/5] image-hover overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base via-base/45 to-transparent" />
                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-cream/10 backdrop-blur-md text-[10px] uppercase tracking-[0.18em] text-cream/85 border border-cream/15">
                  {p.type}
                </span>
              </div>

              <div className="p-5 lg:p-6 -mt-24 relative z-10">
                <div className="eyebrow text-cream/60 flex items-center gap-1.5">
                  <MapPin size={11} /> {p.region}
                </div>
                <h3 className="serif text-2xl mt-2 tracking-tight font-medium leading-tight">{p.name}</h3>
                <p className="mt-3 text-[14px] text-cream/65 leading-relaxed">{p.description}</p>
                {p.highlights?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.highlights.slice(0, 4).map((h) => (
                      <span key={h} className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-ember/15 text-ember border border-ember/30">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_0_0_1px_rgba(210,119,46,0)] group-hover:shadow-[inset_0_0_0_1px_rgba(210,119,46,0.35),0_30px_80px_-30px_rgba(210,119,46,0.45)] transition-shadow duration-500" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
