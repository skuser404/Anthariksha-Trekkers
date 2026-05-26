import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

// ----- shared toast (success / error messages) -----
let toastListeners = [];
export function toast(message, kind = 'success') {
  toastListeners.forEach((fn) => fn({ id: Date.now() + Math.random(), message, kind }));
}

export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const fn = (t) => {
      setItems((arr) => [...arr, t]);
      setTimeout(() => setItems((arr) => arr.filter((i) => i.id !== t.id)), 2600);
    };
    toastListeners.push(fn);
    return () => { toastListeners = toastListeners.filter((l) => l !== fn); };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.7, 0, 0.2, 1] }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-xl border shadow-2xl text-sm ${
              t.kind === 'error'
                ? 'bg-ember/15 border-ember/40 text-cream'
                : 'bg-moss/15 border-moss/40 text-cream'
            }`}
          >
            {t.kind === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ----- realtime subscription on a table -----
export function useTable(tableName, query) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Hard timeout — never let Loading hang past 8s
    const safety = setTimeout(() => {
      if (cancelled) return;
      console.warn(`[useTable:${tableName}] fetch timeout`);
      setError('Network timeout — check Supabase connection');
      setLoading(false);
    }, 8000);

    (async () => {
      try {
        let q = supabase.from(tableName).select(query?.select || '*');
        if (query?.order) q = q.order(query.order, { ascending: query.ascending !== false });
        if (query?.limit) q = q.limit(query.limit);
        const { data, error } = await q;
        if (cancelled) return;
        if (error) setError(error.message);
        setRows(data || []);
      } catch (e) {
        if (cancelled) return;
        console.warn(`[useTable:${tableName}] threw`, e);
        setError(e?.message || 'Failed to load');
      } finally {
        clearTimeout(safety);
        if (!cancelled) setLoading(false);
      }
    })();

    // realtime channel — re-fetches on any change
    const channel = supabase
      .channel(`realtime:${tableName}:${version}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
        reload();
      })
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(safety);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, version]);

  return { rows, loading, error, reload };
}

// ----- styled form primitives -----
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] uppercase tracking-[0.2em] text-cream/60 mb-2">{label}</span>
      {children}
      {hint && <span className="block mt-1.5 text-[11px] text-cream/45">{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-lg bg-cream/[0.05] border border-cream/15 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30 text-sm text-cream placeholder-cream/30 transition-colors"
      {...rest}
    />
  );
}

export function TextArea({ value, onChange, rows = 4, ...rest }) {
  return (
    <textarea
      rows={rows}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-lg bg-cream/[0.05] border border-cream/15 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30 text-sm text-cream placeholder-cream/30 transition-colors font-mono leading-relaxed"
      {...rest}
    />
  );
}

export function Select({ value, onChange, options, ...rest }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-lg bg-cream/[0.05] border border-cream/15 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30 text-sm text-cream transition-colors"
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-base">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span
        className={`relative inline-block h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-ember' : 'bg-cream/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-cream transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
      <span className="text-sm text-cream/75">{label}</span>
    </button>
  );
}

export function Button({ children, variant = 'primary', loading, ...rest }) {
  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40';
  const styles = {
    primary: 'bg-ember text-cream hover:bg-cream hover:text-ink',
    ghost: 'border border-cream/20 text-cream/85 hover:border-cream/60',
    danger: 'border border-ember/40 text-ember hover:bg-ember/10'
  };
  return (
    <button className={`${base} ${styles[variant]}`} {...rest}>
      {loading ? 'Saving…' : children}
    </button>
  );
}

export function EditorShell({ title, subtitle, action, previewHref, children }) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <span className="eyebrow text-ember">Editor</span>
          <h2 className="serif text-3xl lg:text-4xl mt-2 tracking-tight font-medium">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-cream/55 max-w-xl">{subtitle}</p>}
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-ember link-underline"
            >
              View on site ↗
            </a>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="p-12 rounded-2xl border border-cream/10 text-center text-cream/55 text-sm">
      {children}
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] bg-moss/20 text-moss border border-moss/40">
      <span className="h-1.5 w-1.5 rounded-full bg-moss animate-pulse" /> Live sync
    </span>
  );
}
