import { motion } from 'framer-motion';

export default function VideoStory() {
  return (
    <section className="relative w-full bg-base text-cream overflow-hidden">
      <div className="relative h-[80vh] lg:h-[100vh] w-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="https://www.genspark.ai/api/files/s/yUjxQrgJ"
        >
          <source src="/mountain.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.7, 0, 0.2, 1] }}
            className="serif text-4xl md:text-6xl lg:text-7xl xl:text-[6rem] tracking-tight font-medium leading-[1.05] max-w-5xl"
          >
            Two days. One ridge. <em className="italic text-ember">A thousand frames.</em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-8 eyebrow text-cream/70"
          >
            Filmed on our Kudremukh weekend · November 2025
          </motion.p>
        </div>
      </div>
    </section>
  );
}
