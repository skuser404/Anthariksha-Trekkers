import { motion } from 'framer-motion';

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
          <h2 className="serif mt-8 text-[8vw] sm:text-6xl lg:text-7xl xl:text-[5.2rem] leading-[0.98] tracking-tight font-medium">
            We don't sell trips.<br />
            We design mountain <em className="italic text-ember">experiences</em> — built for people who chase fog, ridgelines, silent forests, and the kind of sunrise you don't post, you remember.
          </h2>
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
            <div>
              <div className="serif text-4xl text-ember">12+</div>
              <div className="eyebrow text-muted mt-2">Ghats Routes</div>
            </div>
            <div>
              <div className="serif text-4xl text-ember">2,400+</div>
              <div className="eyebrow text-muted mt-2">Trekkers led</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
