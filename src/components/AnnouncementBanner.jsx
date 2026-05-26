import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle2, Megaphone } from 'lucide-react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';

const DISMISSED_KEY = 'anth-ann-dismissed';

const TONE_STYLES = {
  ember:   { bg: 'bg-ember', text: 'text-cream', icon: Megaphone },
  info:    { bg: 'bg-ink',   text: 'text-cream', icon: Info },
  success: { bg: 'bg-moss',  text: 'text-cream', icon: CheckCircle2 },
  warning: { bg: 'bg-amber-500/95', text: 'text-ink', icon: AlertTriangle }
};

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState(null);
  const [popup, setPopup] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')); } catch { return new Set(); }
  });

  async function fetchActive() {
    if (!supabaseEnabled) return;
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, link_url, link_label, tone, display_as, display_order')
      .order('display_order', { ascending: true })
      .limit(5);
    if (error || !data) return;

    const visible = data.filter((a) => !dismissed.has(a.id));
    setBanner(visible.find((a) => a.display_as === 'banner' || a.display_as === 'both') || null);
    setPopup(visible.find((a) => a.display_as === 'popup' || a.display_as === 'both') || null);
  }

  useEffect(() => {
    fetchActive();
    if (!supabaseEnabled) return;
    const channel = supabase
      .channel('realtime:announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchActive)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  function dismiss(id) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
  }

  return (
    <>
      <AnimatePresence>
        {banner && (
          <Banner key={banner.id} ann={banner} onDismiss={() => dismiss(banner.id)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {popup && (
          <Popup key={popup.id} ann={popup} onClose={() => dismiss(popup.id)} />
        )}
      </AnimatePresence>
    </>
  );
}

function Banner({ ann, onDismiss }) {
  const style = TONE_STYLES[ann.tone] || TONE_STYLES.ember;
  const Icon = style.icon;
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
      className={`fixed top-0 inset-x-0 z-[55] ${style.bg} ${style.text}`}
      role="status"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-10 py-2.5 flex items-center gap-3 text-sm">
        <Icon size={15} className="flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">{ann.title}</span>
          {ann.body && <span className="opacity-85 text-[13px]">{ann.body}</span>}
          {ann.link_url && (
            <a
              href={ann.link_url}
              className="font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              {ann.link_label || 'Learn more'} →
            </a>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="flex-shrink-0 h-7 w-7 grid place-items-center rounded-full hover:bg-black/15 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function Popup({ ann, onClose }) {
  const style = TONE_STYLES[ann.tone] || TONE_STYLES.ember;
  const Icon = style.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[150] grid place-items-center bg-base/80 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
        className="relative max-w-md w-full rounded-2xl bg-cream text-ink p-7 lg:p-9 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`inline-flex items-center justify-center h-12 w-12 rounded-full ${style.bg} ${style.text} mb-5`}>
          <Icon size={20} />
        </div>
        <h3 className="serif text-2xl lg:text-3xl mb-3">{ann.title}</h3>
        {ann.body && <p className="text-sm text-ink/75 leading-relaxed">{ann.body}</p>}
        <div className="mt-6 flex items-center gap-3">
          {ann.link_url && (
            <a href={ann.link_url} className="btn-pill btn-solid">
              {ann.link_label || 'Learn more'} <span className="arrow">→</span>
            </a>
          )}
          <button onClick={onClose} className="text-sm link-underline">Dismiss</button>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-ink/5 hover:bg-ink/10 grid place-items-center transition-colors"
        >
          <X size={16} />
        </button>
      </motion.div>
    </motion.div>
  );
}
