import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, KeyRound, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export default function MfaEnroll({ userEmail, onSuccess, onCancel }) {
  const [factor, setFactor] = useState(null);
  const [qrSvgUrl, setQrSvgUrl] = useState(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setEnrolling(true);
      setErr(null);

      // Clean up any half-enrolled factors first so re-runs work
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const unverified = existing?.all?.filter((f) => f.status !== 'verified') || [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Anthariksha Admin · ${new Date().toLocaleDateString()}`
      });
      if (error) {
        setErr(error.message);
        setEnrolling(false);
        return;
      }
      setFactor(data);
      // Supabase returns qr_code either as a complete data URI (data:image/svg+xml;utf8,...)
      // or as a raw <svg> string. Handle both — use directly if data URI, else wrap.
      const raw = data?.totp?.qr_code || '';
      if (raw.startsWith('data:')) {
        setQrSvgUrl(raw);
      } else if (raw) {
        try {
          setQrSvgUrl(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(raw)))}`);
        } catch {
          setQrSvgUrl(null);
        }
      } else {
        setQrSvgUrl(null);
      }
      setSecret(data?.totp?.secret || '');
      setEnrolling(false);
    })();
  }, []);

  async function verify(e) {
    e?.preventDefault();
    if (!factor) return;
    setErr(null);
    setBusy(true);

    const timeoutId = setTimeout(() => {
      console.warn('[mfa-enroll] verify timeout');
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
      if (vErr) { setErr(vErr.message); setCode(''); return; }
      onSuccess?.();
    } catch (err) {
      console.warn('[mfa-enroll] verify threw', err);
      setErr(err?.message || 'Verification failed. Try again.');
    } finally {
      clearTimeout(timeoutId);
      setBusy(false);
    }
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-base text-cream grid place-items-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
        className="w-full max-w-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-full bg-ember/15 text-ember grid place-items-center">
            <ShieldCheck size={20} strokeWidth={1.6} />
          </div>
          <div>
            <div className="eyebrow text-ember">Two-Factor Setup</div>
            <h1 className="serif text-3xl mt-1">Secure your admin account</h1>
          </div>
        </div>

        <p className="text-cream/65 text-sm leading-relaxed mb-8">
          Scan the QR code below with <strong className="text-cream">Google Authenticator</strong> (or any
          TOTP app — Authy, 1Password, Microsoft Authenticator). Then enter the 6-digit code it shows.
        </p>

        {enrolling && (
          <div className="text-cream/45 text-sm">Generating your secure key…</div>
        )}

        {!enrolling && qrSvgUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] gap-6 items-start">
            <div className="rounded-2xl bg-cream p-4 grid place-items-center">
              <img src={qrSvgUrl} alt="Scan with Google Authenticator" className="w-44 h-44" />
            </div>
            <div className="text-sm text-cream/70 space-y-3">
              <div>
                <div className="eyebrow text-cream/50 mb-1">Account</div>
                <div className="text-cream">{userEmail}</div>
              </div>
              <div>
                <div className="eyebrow text-cream/50 mb-1">Backup key</div>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] text-cream/85 bg-cream/5 px-2 py-1.5 rounded font-mono break-all">{secret}</code>
                  <button onClick={copySecret} className="h-8 w-8 rounded-full bg-cream/10 hover:bg-ember hover:text-cream grid place-items-center transition-colors flex-shrink-0">
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="text-[11px] text-cream/45 mt-2">Store this somewhere safe — used to restore access if you lose your phone.</div>
              </div>
            </div>
          </div>
        )}

        {!enrolling && (
          <form onSubmit={verify} className="mt-10">
            <label className="block">
              <span className="eyebrow text-cream/60 mb-2 block">6-digit code from your authenticator</span>
              <div className="flex items-center gap-3">
                <KeyRound size={16} className="text-ember" />
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
                  className="flex-1 bg-transparent border-b border-cream/20 focus:border-ember outline-none py-2 text-2xl tracking-[0.4em] text-cream font-mono"
                />
              </div>
            </label>

            {err && <div className="mt-5 text-sm text-ember">{err}</div>}

            <div className="mt-8 flex items-center gap-3">
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="flex-1 px-6 py-3 rounded-full bg-cream text-ink font-medium disabled:opacity-40 hover:bg-ember hover:text-cream transition-colors"
              >
                {busy ? 'Verifying…' : 'Verify & Enable 2FA'}
              </button>
              {onCancel && (
                <button type="button" onClick={onCancel} className="text-sm text-cream/55 hover:text-cream transition-colors px-4">
                  Sign out
                </button>
              )}
            </div>
          </form>
        )}

        <p className="mt-10 text-xs text-cream/40">
          From now on, every sign-in will require both your password and a code from your authenticator app.
        </p>
      </motion.div>
    </div>
  );
}
