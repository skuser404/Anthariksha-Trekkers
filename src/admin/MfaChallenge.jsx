import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_KEY = 'anth-mfa-lockout';

function readLockout() {
  try { return JSON.parse(sessionStorage.getItem(LOCKOUT_KEY) || '{}'); }
  catch { return {}; }
}
function writeLockout(data) {
  sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
}

export default function MfaChallenge({ factor, onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const lockedRef = useRef(false);

  // 30-second TOTP cycle indicator
  const period = 30;
  const secondsLeft = period - (Math.floor(Date.now() / 1000) % period);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function verify(e) {
    e?.preventDefault();

    const store = readLockout();
    if (store.lockedUntil && store.lockedUntil > Date.now()) {
      lockedRef.current = true;
      setErr(`Too many wrong codes. Try again in ${Math.ceil((store.lockedUntil - Date.now()) / 60000)} min.`);
      return;
    }

    setErr(null);
    setBusy(true);

    // Hard timeout — never let the button hang past 12s
    const timeoutId = setTimeout(() => {
      console.warn('[mfa] verify timeout — resetting busy state');
      setBusy(false);
      setErr('Verification timed out. Check your connection and try again.');
    }, 12000);

    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (cErr) { setErr(cErr.message); return; }

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code: code.replace(/\s/g, '')
      });

      if (vErr) {
        const attempts = (store.attempts || 0) + 1;
        const next = { attempts };
        if (attempts >= MAX_ATTEMPTS) {
          next.lockedUntil = Date.now() + 10 * 60_000;
          setErr('Too many wrong codes. Locked for 10 minutes.');
        } else {
          setErr(`Invalid code. ${MAX_ATTEMPTS - attempts} attempts left.`);
        }
        writeLockout(next);
        setCode('');
        return;
      }

      writeLockout({});
      onSuccess?.();
    } catch (err) {
      console.warn('[mfa] verify threw', err);
      setErr(err?.message || 'Verification failed. Try again.');
    } finally {
      clearTimeout(timeoutId);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-base text-cream grid place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-full bg-ember/15 text-ember grid place-items-center">
            <ShieldCheck size={20} strokeWidth={1.6} />
          </div>
          <div>
            <div className="eyebrow text-ember">Two-Factor Required</div>
            <h1 className="serif text-2xl mt-1">Enter your authenticator code</h1>
          </div>
        </div>

        <p className="text-cream/60 text-sm leading-relaxed mb-8">
          Open Google Authenticator (or your TOTP app) and enter the 6-digit code shown for Anthariksha Admin.
        </p>

        <form onSubmit={verify}>
          <div className="flex items-center gap-3">
            <KeyRound size={16} className="text-ember flex-shrink-0" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              className="flex-1 bg-transparent border-b border-cream/20 focus:border-ember outline-none py-2 text-3xl tracking-[0.4em] text-cream font-mono text-center"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-cream/45">
            <span>Code refreshes every 30 s</span>
            <span className="font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember mr-1.5 animate-pulse" />
              {secondsLeft}s
            </span>
          </div>

          {err && <div className="mt-6 text-sm text-ember">{err}</div>}

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy || code.length !== 6 || lockedRef.current}
              className="flex-1 px-6 py-3 rounded-full bg-cream text-ink font-medium disabled:opacity-40 hover:bg-ember hover:text-cream transition-colors"
            >
              {busy ? 'Verifying…' : 'Continue'}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-sm text-cream/55 hover:text-cream transition-colors px-4">
                Sign out
              </button>
            )}
          </div>
        </form>

        <p className="mt-10 text-xs text-cream/40">
          5 wrong codes → 10-minute lockout · Sessions still auto-expire after 30 minutes of inactivity.
        </p>
      </motion.div>
    </div>
  );
}
