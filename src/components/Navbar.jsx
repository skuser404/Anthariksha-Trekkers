import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone } from 'lucide-react';

const links = [
  { label: 'Treks', href: '#treks' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Explore', href: '#explore-around' },
  { label: 'About', href: '#experience' },
  { label: 'Contact', href: '#contact' }
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-cream/95 backdrop-blur-md text-ink border-b border-ink/5'
          : 'bg-transparent text-cream'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3 group" aria-label="Anthariksha Trekkers — home">
          <img
            src="/images/logo.png"
            alt="Anthariksha Trekkers logo"
            className="h-11 w-11 lg:h-12 lg:w-12 rounded-full object-cover ring-1 ring-current/15 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:rotate-[6deg]"
          />
          <span className="serif text-xl lg:text-2xl font-medium tracking-tight leading-none">
            Anthariksha <span className="text-ember">Trekkers</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-10 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="link-underline">{l.label}</a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-6">
          <a href="tel:+919902704361" className="flex items-center gap-2 text-sm link-underline">
            <Phone size={14} /> +91 9902704361
          </a>
          <a href="#batches" className="btn-pill btn-solid">
            Book Now <span className="arrow">→</span>
          </a>
        </div>

        <button
          className="lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={26} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-base text-cream lg:hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-cream/10">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="Anthariksha Trekkers" className="h-11 w-11 rounded-full object-cover ring-1 ring-cream/20" />
                <span className="serif text-xl leading-none">Anthariksha <span className="text-ember">Trekkers</span></span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={26} />
              </button>
            </div>
            <nav className="flex flex-col p-6 gap-6 mt-6">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                  className="serif text-4xl"
                >
                  {l.label}
                </motion.a>
              ))}
              <a href="tel:+919902704361" className="mt-10 text-sm opacity-70">+91 9902704361</a>
              <a href="#batches" onClick={() => setOpen(false)} className="btn-pill btn-solid w-fit mt-4">
                Book Now <span className="arrow">→</span>
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
