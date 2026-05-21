import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Compass } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';

const STATIC = [
  {
    name: 'Hidlumane Falls',
    region: 'Near Kodachadri',
    type: 'Waterfall',
    image: '/images/waterfall.jpg',
    description: 'A monsoon-fed plunge falls mid-route on the Kodachadri trek. Swim, eat lunch, climb on.'
  },
  {
    name: 'Bhattara Mane',
    region: 'Kukke Subramanya',
    type: 'Legendary homestay',
    image: '/images/forest-stream.jpg',
    description: 'The mandatory food stop on the Kumara Parvatha trek. Hot meals, mountain folklore, cold floor sleep.'
  },
  {
    name: 'Mookambika Temple',
    region: 'Kollur · Shimoga',
    type: 'Temple',
    image: '/images/misty-trees.jpg',
    description: '8th-century shrine on the Kodachadri route. Most trekkers pause here at sunrise on the way back.'
  },
  {
    name: 'Mandalpatti Viewpoint',
    region: 'Coorg',
    type: 'Sunrise spot',
    image: '/images/blue-sky-ridge.jpg',
    description: 'Jeep ride through coffee country to a sea-of-clouds sunrise. 30 minutes from Madikeri.'
  },
  {
    name: 'Dubare Elephant Camp',
    region: 'Coorg · Kaveri river',
    type: 'Wildlife',
    image: '/images/forest-stream.jpg',
    description: 'Wade across the Kaveri to bathe and feed elephants. A side-trip after the Coorg trek.'
  },
  {
    name: 'Mawlynnong Village',
    region: 'East Khasi Hills · Meghalaya',
    type: 'Heritage',
    image: '/images/green-ridge.jpg',
    description: '"Cleanest village in Asia." Living-root bridges, sky walk, bamboo cafes. On the Meghalaya itinerary.'
  },
  {
    name: 'Agumbe Sunset Point',
    region: 'Shimoga · Karnataka',
    type: 'Sunset',
    image: '/images/hero-sunrise.jpg',
    description: 'Watch the Arabian Sea swallow the sun from the rainforest cliffs of Agumbe.'
  },
  {
    name: 'Banasura Sagar Dam',
    region: 'Wayanad · Kerala',
    type: 'Reservoir',
    image: '/images/cliff-summit.jpg',
    description: 'Largest earth dam in India. Backwaters set against the Banasura Hills.'
  }
];

export default function ExploreAround() {
  const [places, setPlaces] = useState(STATIC);

  useEffect(() => {
    if (!supabaseEnabled) return;
    (async () => {
      const { data, error } = await supabase
        .from('nearby_places')
        .select('name, region, type, image, description, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (!error && data && data.length) setPlaces(data);
    })();
  }, []);

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
            Waterfalls, temples, sunset cliffs and hidden villages — places worth stopping for
            on the way to or from every trek.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {places.map((p, i) => (
            <motion.article
              key={p.name + i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1], delay: (i % 4) * 0.07 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur border border-cream/10 hover:border-ember/40 transition-colors duration-500"
            >
              <div className="relative aspect-[4/5] image-hover overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent" />
                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-cream/10 backdrop-blur-md text-[10px] uppercase tracking-[0.18em] text-cream/85 border border-cream/15">
                  {p.type}
                </span>
              </div>

              <div className="p-5 lg:p-6 -mt-20 relative z-10">
                <div className="eyebrow text-cream/60 flex items-center gap-1.5">
                  <MapPin size={11} /> {p.region}
                </div>
                <h3 className="serif text-2xl mt-2 tracking-tight font-medium leading-tight">{p.name}</h3>
                <p className="mt-3 text-[14px] text-cream/65 leading-relaxed">{p.description}</p>
              </div>

              <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_0_0_1px_rgba(210,119,46,0)] group-hover:shadow-[inset_0_0_0_1px_rgba(210,119,46,0.35),0_30px_80px_-30px_rgba(210,119,46,0.45)] transition-shadow duration-500" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
