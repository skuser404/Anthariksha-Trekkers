import { Instagram, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-base text-cream border-t border-cream/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <a href="#" className="flex items-center gap-4 group" aria-label="Anthariksha Trekkers — home">
              <img
                src="/images/logo.png"
                alt="Anthariksha Trekkers logo"
                className="h-16 w-16 rounded-full object-cover ring-1 ring-cream/15 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-105"
              />
              <span className="serif text-3xl font-medium leading-tight">Anthariksha <span className="text-ember">Trekkers</span></span>
            </a>
            <p className="serif italic mt-6 text-2xl lg:text-3xl leading-tight max-w-md text-cream/90">
              Born to Trek. Built to Explore.
            </p>
            <p className="mt-8 text-sm text-cream/55 max-w-sm leading-relaxed">
              A Bangalore-based trekking collective leading curated weekend adventures across Karnataka's Western Ghats.
            </p>
          </div>

          <div className="lg:col-span-3">
            <div className="eyebrow text-cream/50 mb-6">Navigate</div>
            <ul className="space-y-4 text-cream/90">
              <li><a href="#treks" className="link-underline">Treks</a></li>
              <li><a href="#experience" className="link-underline">Experience</a></li>
              <li><a href="#journal" className="link-underline">Journal</a></li>
              <li><a href="#contact" className="link-underline">Contact</a></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="eyebrow text-cream/50 mb-6">Get in touch</div>
            <ul className="space-y-4 text-cream/90">
              <li>
                <a
                  href="https://www.instagram.com/anthariksha_trekkers/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 link-underline"
                >
                  <Instagram size={16} /> @anthariksha_trekkers
                </a>
              </li>
              <li>
                <a href="tel:+919902704361" className="inline-flex items-center gap-3 link-underline">
                  <Phone size={16} /> +91 9902704361
                </a>
              </li>
              <li>
                <a
                  href="https://share.google/ufuKbaOOrvE3GrxJg"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 link-underline"
                >
                  <MapPin size={16} /> Bangalore, Karnataka · Google Profile
                </a>
              </li>
            </ul>

            <a
              href="https://wa.me/919902704361"
              target="_blank"
              rel="noreferrer"
              className="btn-pill btn-solid mt-10"
            >
              WhatsApp Us <span className="arrow">→</span>
            </a>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-cream/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-cream/50">
          <span>© 2026 Anthariksha Trekkers · Bangalore · Made with the mountains in mind.</span>
          <span>Western Ghats · India</span>
        </div>
      </div>
    </footer>
  );
}
