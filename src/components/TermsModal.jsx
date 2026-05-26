import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import { Markdown } from '../lib/markdown.jsx';

const FALLBACK = {
  terms: { title: 'Terms & Conditions', body: '# Terms & Conditions\n\nBy booking a trek with Anthariksha Trekkers, you agree to our standard booking, safety, and conduct terms. Full document available on request.' },
  cancellation: { title: 'Cancellation Policy', body: '# Cancellation Policy\n\n- 60+ days before: 10%\n- 30–60 days: 25%\n- 15–30 days: 50%\n- 7–15 days: 75%\n- 0–7 days: 100%\n\nWeather/force-majeure: alternate batches offered, no cash refund.' },
  privacy: { title: 'Privacy Policy', body: '# Privacy Policy\n\nWe collect only the booking details you provide and store them securely. No data is sold or shared with third parties.' }
};

export default function TermsModal({ kind, onClose }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (supabaseEnabled) {
        const { data, error } = await supabase
          .from('terms_documents')
          .select('title, body')
          .eq('kind', kind)
          .eq('is_published', true)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data) {
          setDoc(data);
          setLoading(false);
          return;
        }
      }
      if (!cancelled) {
        setDoc(FALLBACK[kind] || FALLBACK.terms);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [kind]);

  // Lock background scroll while open
  useEffect(() => {
    window.__lenis?.stop();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      window.__lenis?.start();
    };
  }, []);

  // Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[140] flex items-stretch justify-center"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          className="absolute inset-0 bg-base/85 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
          className="relative z-10 w-full lg:my-10 lg:mx-6 lg:max-w-3xl bg-cream text-ink rounded-none lg:rounded-3xl overflow-hidden flex flex-col max-h-[100vh] lg:max-h-[90vh]"
        >
          <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 flex items-center justify-between bg-cream/95 backdrop-blur border-b border-ink/10">
            <div>
              <div className="eyebrow text-ember">Policy</div>
              <div className="serif text-2xl mt-1">{doc?.title || 'Loading…'}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-11 w-11 rounded-full bg-ink/5 hover:bg-ember hover:text-cream grid place-items-center transition-colors"
            >
              <X size={18} />
            </button>
          </header>

          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto modal-scroll px-6 lg:px-10 py-8 lg:py-10"
          >
            {loading && <div className="text-ink/40 text-sm">Loading…</div>}
            {doc && !loading && <Markdown>{doc.body}</Markdown>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
