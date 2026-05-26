import { useEffect, useState } from 'react';
import { Instagram, Youtube, Facebook, Linkedin, Phone, Mail, Globe, MessageCircle, MapPin, Twitter } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import TermsModal from './TermsModal.jsx';

const ICONS = {
  instagram: Instagram,
  youtube: Youtube,
  whatsapp: MessageCircle,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  phone: Phone,
  email: Mail,
  google: MapPin,
  website: Globe
};

const STATIC_LINKS = [
  { platform: 'instagram', label: 'Instagram',       url: 'https://www.instagram.com/anthariksha_trekkers/', handle: '@anthariksha_trekkers' },
  { platform: 'whatsapp',  label: 'WhatsApp',        url: 'https://wa.me/919902704361',                       handle: '+91 99027 04361' },
  { platform: 'phone',     label: 'Phone',           url: 'tel:+919902704361',                                 handle: '+91 99027 04361' },
  { platform: 'google',    label: 'Google Business', url: 'https://share.google/ufuKbaOOrvE3GrxJg',           handle: 'Anthariksha Trekkers' }
];

export default function Footer() {
  const [links, setLinks] = useState(STATIC_LINKS);
  const [openKind, setOpenKind] = useState(null);

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('social_links')
        .select('platform, label, url, handle, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (cancelled) return;
      if (!error && data && data.length) setLinks(data);
    }
    load();
    const channel = supabase
      .channel('realtime:social_links')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_links' }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

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
              <li><a href="#gallery" className="link-underline">Gallery</a></li>
              <li><a href="#explore-around" className="link-underline">Explore Around</a></li>
              <li><a href="#contact" className="link-underline">Contact</a></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="eyebrow text-cream/50 mb-6">Get in touch</div>
            <ul className="space-y-4 text-cream/90">
              {links.map((l) => {
                const Icon = ICONS[l.platform] || Globe;
                return (
                  <li key={l.platform + l.url}>
                    <a
                      href={l.url}
                      target={l.url.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 link-underline"
                    >
                      <Icon size={16} /> {l.handle || l.label}
                    </a>
                  </li>
                );
              })}
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

        <div className="mt-20 pt-8 border-t border-cream/10 flex flex-col gap-6">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-cream/55">
            <button onClick={() => setOpenKind('terms')} className="link-underline hover:text-cream transition-colors">Terms &amp; Conditions</button>
            <span className="text-cream/20">·</span>
            <button onClick={() => setOpenKind('cancellation')} className="link-underline hover:text-cream transition-colors">Cancellation Policy</button>
            <span className="text-cream/20">·</span>
            <button onClick={() => setOpenKind('privacy')} className="link-underline hover:text-cream transition-colors">Privacy Policy</button>
            <span className="text-cream/20">·</span>
            <button onClick={() => setOpenKind('safety')} className="link-underline hover:text-cream transition-colors">Safety Guidelines</button>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-cream/50">
            <span>© 2026 Anthariksha Trekkers · Bangalore · Made with the mountains in mind.</span>

            <div className="flex flex-col sm:flex-row md:items-end gap-6 sm:gap-10">
              <div className="flex flex-col md:items-end gap-1 text-left md:text-right">
                <span className="eyebrow text-cream/40">Designed by</span>
                <span className="serif text-base text-cream/85 leading-none transition-[text-shadow] duration-700 hover:[text-shadow:0_0_18px_rgba(210,119,46,0.45)]">
                  G. Sunil Kumar
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-cream/45">
                  Cybersecurity &amp; Web Developer
                </span>
              </div>
              <div className="flex flex-col md:items-end gap-1 text-left md:text-right">
                <span className="eyebrow text-cream/40">Alongside</span>
                <span className="serif text-base text-cream/85 leading-none transition-[text-shadow] duration-700 hover:[text-shadow:0_0_18px_rgba(210,119,46,0.45)]">
                  Anushka
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-cream/45">
                  Data Analytics &amp; AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {openKind && <TermsModal kind={openKind} onClose={() => setOpenKind(null)} />}
    </footer>
  );
}
