import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'Treks', href: '#treks' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Explore', href: '#explore-around' }
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
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled ? 'text-ink' : 'text-cream'
      }`}
    >
      {/* Subtle backdrop wash that appears when scrolled */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-cream/85 backdrop-blur-xl border-b border-ink/5" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-5 lg:px-10 py-4 lg:py-5 flex items-center justify-between gap-4">
        <a href="#" className="flex items-center gap-3 group flex-shrink-0" aria-label="Anthariksha Trekkers — home">
          <img
            src="/images/logo.png"
            alt="Anthariksha Trekkers logo"
            className="h-11 w-11 lg:h-12 lg:w-12 rounded-full object-cover ring-1 ring-current/15 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:rotate-[6deg]"
          />
          <span className="serif text-lg lg:text-2xl font-medium tracking-tight leading-none whitespace-nowrap">
            Anthariksha <span className="text-ember">Trekkers</span>
          </span>
        </a>

        {/* Glassmorphism bubble nav */}
        <nav
          className={`hidden lg:flex items-center gap-1 p-1.5 rounded-full backdrop-blur-xl border transition-colors duration-500 ${
            scrolled
              ? 'bg-ink/[0.04] border-ink/10 shadow-[0_8px_30px_rgba(20,25,26,0.06)]'
              : 'bg-cream/8 border-cream/15 shadow-[0_8px_30px_rgba(0,0,0,0.18)]'
          }`}
          style={{ backgroundColor: scrolled ? undefined : 'rgba(244,239,230,0.08)' }}
        >
          {links.map((l) => (
            <NavPill key={l.href} href={l.href} scrolled={scrolled}>
              {l.label}
            </NavPill>
          ))}
          <a
            href="#batches"
            className="ml-1 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-ember text-cream text-sm font-medium hover:bg-cream hover:text-ink transition-all duration-400 shadow-[0_0_0_rgba(210,119,46,0)] hover:shadow-[0_0_30px_rgba(210,119,46,0.55)]"
          >
            Book Now <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </nav>

        <button
          className="lg:hidden h-10 w-10 grid place-items-center rounded-full bg-current/10 backdrop-blur-md"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
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

function NavPill({ href, children, scrolled }) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        scrolled
          ? 'text-ink/80 hover:text-ink hover:bg-ink/[0.06]'
          : 'text-cream/85 hover:text-cream hover:bg-cream/10'
      }`}
    >
      {children}
    </a>
  );
}
