import { motion } from 'framer-motion';
import { Users, Mountain, UtensilsCrossed } from 'lucide-react';

const items = [
  { icon: Users, title: 'Batch Groups', body: '30-40 trekkers per batch. Big enough for energy. Small enough to stay together on the trail.' },
  { icon: Mountain, title: 'Real Western Ghats Routes', body: 'Hand-scouted trails, no tourist circuits. Forest, fog, ridge, summit.' },
  { icon: UtensilsCrossed, title: 'Veg + Non-Veg Meals & Stay', body: 'Homestay rooms, hot meals, chai at the right altitude. Always.' }
];

const ease = [0.7, 0, 0.2, 1];

export default function WhyUs() {
  return (
    <section id="experience" className="bg-base text-cream py-24 lg:py-36 border-t border-cream/5">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
          className="max-w-3xl"
        >
          <span className="eyebrow text-cream/60">Why Anthariksha</span>
          <h2 className="serif mt-4 text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium">
            Built different. <em className="italic text-ember">On purpose.</em>
          </h2>
        </motion.div>

        <div className="mt-16 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease, delay: i * 0.1 }}
                className="border-t border-cream/15 pt-6"
              >
                <Icon size={28} strokeWidth={1.2} className="text-ember" />
                <h3 className="serif mt-6 text-2xl tracking-tight">{it.title}</h3>
                <p className="mt-3 text-sm text-cream/65 leading-relaxed">{it.body}</p>
                <div className="mt-8 eyebrow text-cream/40">0{i + 1}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
