import { useCallback, useRef, useState } from 'react';

/**
 * useGuardedSubmit — runs an async function with:
 *   - duplicate-call protection (in-flight lock)
 *   - cooldown after success (debounce)
 *   - a fingerprint so identical payloads can't double-fire
 *
 * Usage:
 *   const { run, busy, recentlySubmitted } = useGuardedSubmit(async (data) => { ... }, { cooldownMs: 3000 });
 *   <button disabled={busy} onClick={() => run(data)}>Submit</button>
 */
export function useGuardedSubmit(fn, { cooldownMs = 2500 } = {}) {
  const [busy, setBusy] = useState(false);
  const [recentlySubmitted, setRecent] = useState(false);
  const lastFingerprint = useRef(null);
  const lastFiredAt = useRef(0);

  const run = useCallback(
    async (...args) => {
      const now = Date.now();
      const fp = JSON.stringify(args);
      if (busy) return { skipped: 'busy' };
      if (fp === lastFingerprint.current && now - lastFiredAt.current < cooldownMs) {
        return { skipped: 'duplicate' };
      }
      setBusy(true);
      try {
        const result = await fn(...args);
        lastFingerprint.current = fp;
        lastFiredAt.current = Date.now();
        setRecent(true);
        setTimeout(() => setRecent(false), cooldownMs);
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err };
      } finally {
        setBusy(false);
      }
    },
    [fn, busy, cooldownMs]
  );

  return { run, busy, recentlySubmitted };
}

/**
 * useDebounce — debounce any value (e.g., search input).
 * Returns the latest value after `ms` of inactivity.
 */
import { useEffect } from 'react';
export function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
