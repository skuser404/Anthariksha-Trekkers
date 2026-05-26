import { useEffect, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import AdminLogin from './Login.jsx';
import AdminDashboard from './Dashboard.jsx';
import MfaEnroll from './MfaEnroll.jsx';
import MfaChallenge from './MfaChallenge.jsx';

const SESSION_IDLE_MINUTES = 30;
// Flip to true to require Google Authenticator on every sign-in.
const MFA_REQUIRED = false;

export default function AdminRouter() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [aal, setAal] = useState(null); // { currentLevel, nextLevel }
  const [verifiedFactor, setVerifiedFactor] = useState(null);

  // === auth bootstrap ===
  useEffect(() => {
    if (!supabaseEnabled) { setLoading(false); return; }

    let cancelled = false;
    // Safety net — loading must NEVER hang past 6s, no matter what fails.
    const safety = setTimeout(() => {
      if (cancelled) return;
      console.warn('[admin] bootstrap timeout — forcing loading=false');
      setLoading(false);
    }, 6000);

    async function bootstrap(currentSession) {
      if (cancelled) return;
      setSession(currentSession);

      if (!currentSession) {
        setIsAdmin(false);
        setAal(null);
        setVerifiedFactor(null);
        setLoading(false);
        return;
      }

      try {
        await Promise.allSettled([
          refreshAdmin(currentSession.user.id),
          refreshMfa()
        ]);
      } catch (e) {
        console.warn('[admin] bootstrap error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    supabase.auth.getSession()
      .then(({ data }) => bootstrap(data.session))
      .catch((e) => {
        console.warn('[admin] getSession failed', e);
        if (!cancelled) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => bootstrap(s));

    return () => {
      cancelled = true;
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function refreshAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      setIsAdmin(!error && data?.role === 'admin');
    } catch (e) {
      console.warn('[admin] refreshAdmin failed', e);
      setIsAdmin(false);
    }
  }

  async function refreshMfa() {
    try {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setAal(aalData);
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const v = factors?.totp?.find((f) => f.status === 'verified') || null;
      setVerifiedFactor(v);
    } catch (e) {
      console.warn('[admin] refreshMfa failed', e);
      setAal(null);
      setVerifiedFactor(null);
    }
  }

  // === idle session timeout ===
  useEffect(() => {
    if (!session) return;
    let lastActivity = Date.now();
    const reset = () => { lastActivity = Date.now(); };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    const interval = setInterval(() => {
      const idle = (Date.now() - lastActivity) / 60000;
      if (idle > SESSION_IDLE_MINUTES) supabase?.auth.signOut();
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearInterval(interval);
    };
  }, [session]);

  if (!supabaseEnabled) {
    return (
      <SetupGate>
        Supabase isn't configured yet. Create a project, run <code>supabase/schema.sql</code>, then set
        <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>.
      </SetupGate>
    );
  }

  if (loading) return <FullScreen>Loading…</FullScreen>;

  // 1. Not logged in
  if (!session) return <AdminLogin />;

  // 2. Logged in but not an admin → bail
  if (!isAdmin) {
    return (
      <SetupGate>
        Signed in, but this account doesn't have admin role. In Supabase SQL Editor run:<br />
        <code>update public.profiles set role = 'admin' where id = '{session.user.id}';</code>
        <button
          onClick={async () => {
            try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
            try {
              Object.keys(localStorage).forEach((k) => {
                if (k.startsWith('sb-') || k === 'anth-auth') localStorage.removeItem(k);
              });
            } catch {}
            window.location.replace(window.location.pathname);
          }}
          className="mt-6 px-4 py-2 rounded-full bg-white text-ink text-sm"
        >Sign out</button>
      </SetupGate>
    );
  }

  // 3. No verified TOTP factor yet → force enrollment (skipped when MFA disabled)
  if (MFA_REQUIRED && !verifiedFactor) {
    return (
      <MfaEnroll
        userEmail={session.user.email}
        onSuccess={async () => { await refreshMfa(); }}
        onCancel={() => supabase.auth.signOut()}
      />
    );
  }

  // 4. Factor exists but session hasn't been challenged this login → require OTP
  if (MFA_REQUIRED && verifiedFactor && aal && aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
    return (
      <MfaChallenge
        factor={verifiedFactor}
        onSuccess={async () => { await refreshMfa(); }}
        onCancel={() => supabase.auth.signOut()}
      />
    );
  }

  // 5. Fully verified — show dashboard
  return <AdminDashboard user={session.user} />;
}

function FullScreen({ children }) {
  return <div className="min-h-screen grid place-items-center bg-base text-cream">{children}</div>;
}

function SetupGate({ children }) {
  return (
    <div className="min-h-screen grid place-items-center bg-base text-cream px-6">
      <div className="max-w-xl text-center">
        <div className="eyebrow text-ember">Control Panel</div>
        <h1 className="serif text-4xl mt-3 mb-6">Setup required</h1>
        <div className="text-cream/80 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
