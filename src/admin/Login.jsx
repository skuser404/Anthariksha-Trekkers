import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;
const STORE_KEY = 'anth-admin-lockout';

function readLockout() {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLockout(data) {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);

  useEffect(() => {
    const { lockedUntil = 0 } = readLockout();
    if (lockedUntil > Date.now()) setLockedUntil(lockedUntil);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);

    const store = readLockout();
    if (store.lockedUntil && store.lockedUntil > Date.now()) {
      setErr(`Too many attempts. Try again in ${Math.ceil((store.lockedUntil - Date.now()) / 60000)} min.`);
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      // Network / unreachable-backend failures aren't wrong passwords —
      // show a clear message and don't count them toward the lockout.
      const netFail =
        error.name === 'AuthRetryableFetchError' ||
        error.status === 0 ||
        /fetch|network/i.test(error.message || '');
      if (netFail) {
        setErr('Cannot reach the server. Check your connection — or the Supabase project may be paused/deleted.');
        return;
      }
      const attempts = (store.attempts || 0) + 1;
      const next = { attempts };
      if (attempts >= MAX_ATTEMPTS) {
        next.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60_000;
        setLockedUntil(next.lockedUntil);
        setErr(`Too many failed attempts. Locked for ${LOCKOUT_MINUTES} minutes.`);
      } else {
        setErr(`${error.message}. (${MAX_ATTEMPTS - attempts} attempts left)`);
      }
      writeLockout(next);
      return;
    }

    writeLockout({});
  }

  const isLocked = lockedUntil > Date.now();

  return (
    <div className="min-h-screen bg-base text-cream grid place-items-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <div className="eyebrow text-ember mb-3">Control Room</div>
        <h1 className="serif text-4xl mb-2">Restricted access</h1>
        <p className="text-cream/60 text-sm mb-8">Authenticated administrators only.</p>

        <label className="block text-xs uppercase tracking-[0.2em] text-cream/60">Email</label>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLocked || busy}
          className="mt-2 w-full bg-transparent border-b border-cream/20 focus:border-ember outline-none py-2 text-cream"
        />

        <label className="block text-xs uppercase tracking-[0.2em] text-cream/60 mt-6">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLocked || busy}
          className="mt-2 w-full bg-transparent border-b border-cream/20 focus:border-ember outline-none py-2 text-cream"
        />

        {err && <div className="mt-6 text-sm text-ember">{err}</div>}

        <button
          type="submit"
          disabled={isLocked || busy}
          className="mt-10 w-full px-6 py-3 rounded-full bg-cream text-ink font-medium disabled:opacity-40 hover:bg-ember hover:text-cream transition-colors"
        >
          {busy ? 'Verifying…' : isLocked ? 'Locked' : 'Sign In'}
        </button>

        <p className="mt-10 text-xs text-cream/40">
          Sessions auto-expire after 30 minutes of inactivity. 5 failed attempts = 10-minute lockout.
        </p>
      </form>
    </div>
  );
}
