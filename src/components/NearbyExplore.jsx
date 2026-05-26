import { motion } from 'framer-motion';
import { Compass, MapPin } from 'lucide-react';
import { getNearbyPlaces } from '../lib/explorePlaces.js';

/**
 * Compact "Nearby Explore" strip rendered inside TrekModal.
 * Picks 2-5 curated locations based on the trek's id.
 * Light-themed (matches modal cream background, not the dark site).
 */
export default function NearbyExplore({ trekId }) {
  const places = getNearbyPlaces(trekId);
  if (!places || places.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted flex items-center gap-2">
        <Compass size={12} /> Explore Nearby
      </span>
      <p className="mt-3 text-sm text-ink/65 max-w-xl leading-relaxed">
        Worth a detour on the way to or from this trek. Photo stops, temples, and quiet riverbanks.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((p, i) => (
          <motion.article
            key={p.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1], delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-xl bg-mist/40 border border-ink/10 hover:border-ember/40 transition-colors duration-500"
          >
            <div className="relative aspect-[5/4] overflow-hidden bg-ink/5">
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-cream/85 backdrop-blur text-[10px] uppercase tracking-[0.15em] text-ink/85">
                {p.type}
              </span>
              <div className="absolute bottom-3 left-3 right-3 text-cream">
                <div className="eyebrow text-cream/85 flex items-center gap-1.5">
                  <MapPin size={10} /> {p.region}
                </div>
                <h4 className="serif text-base lg:text-lg mt-0.5 leading-tight font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  {p.name}
                </h4>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[13px] text-ink/75 leading-relaxed line-clamp-3">{p.description}</p>
              {p.highlights?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.highlights.slice(0, 3).map((h) => (
                    <span key={h} className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-ember/10 text-ember border border-ember/25">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
