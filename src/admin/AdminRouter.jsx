import { Component, useEffect, useState } from 'react';
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
  const [backendDown, setBackendDown] = useState(false);
  const [adminErr, setAdminErr] = useState(null);
  const [rechecking, setRechecking] = useState(false);

  // === backend reachability probe ===
  // A deleted/paused Supabase project fails DNS — every auth call then
  // dies with a cryptic "Failed to fetch". Detect it up front instead.
  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, { method: 'GET' })
      .then(() => { if (!cancelled) setBackendDown(false); })
      .catch(() => { if (!cancelled) setBackendDown(true); });
    return () => { cancelled = true; };
  }, []);

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
    // Attempt 1: normal client query, but never let it hang (a stuck
    // supabase-js auth lock would otherwise freeze bootstrap forever).
    try {
      const q = supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      const { data, error } = await Promise.race([
        q,
        new Promise((_, rej) => setTimeout(() => rej(new Error('role query timed out')), 5000))
      ]);
      if (error) throw error;
      if (data) {
        setIsAdmin(data.role === 'admin');
        setAdminErr(data.role === 'admin' ? null : `profile role is '${data.role}'`);
        return;
      }
      throw new Error('no profile row visible');
    } catch (e) {
      console.warn('[admin] role query failed, trying raw fetch:', e?.message || e);
    }

    // Attempt 2: raw REST call — bypasses the supabase-js client entirely.
    // Token is read straight from storage so a wedged client can't block us.
    try {
      let token = null;
      try {
        const raw = JSON.parse(localStorage.getItem('anth-auth') || 'null');
        token = raw?.access_token || raw?.currentSession?.access_token || null;
      } catch {}
      if (!token) throw new Error('no stored session token');

      const ctrl = new AbortController();
      const kill = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=role&id=eq.${userId}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`
          },
          signal: ctrl.signal
        }
      );
      clearTimeout(kill);
      const rows = await res.json().catch(() => null);
      if (res.ok && Array.isArray(rows) && rows[0]) {
        setIsAdmin(rows[0].role === 'admin');
        setAdminErr(rows[0].role === 'admin' ? null : `profile role is '${rows[0].role}'`);
        return;
      }
      setIsAdmin(false);
      setAdminErr(`role check HTTP ${res.status} — ${JSON.stringify(rows).slice(0, 180)}`);
    } catch (e) {
      console.warn('[admin] raw role fetch failed', e);
      setIsAdmin(false);
      setAdminErr(
        e?.name === 'AbortError'
          ? 'role check timed out — network to Supabase may be blocked in this browser'
          : String(e?.message || e)
      );
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

  if (backendDown) {
    return (
      <SetupGate>
        The backend can't be reached — the Supabase project behind this site appears to be
        paused or deleted. Restore it from the Supabase dashboard (or create a new project and
        run <code>supabase/SETUP_ALL.sql</code>), update <code>VITE_SUPABASE_URL</code> /
        <code>VITE_SUPABASE_ANON_KEY</code>, and redeploy.
        <button
          onClick={() => window.location.reload()}
          className="mt-6 mx-auto block px-4 py-2 rounded-full bg-white text-ink text-sm"
        >Retry</button>
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
        Signed in, but the admin role check didn't pass for this account.
        {adminErr && (
          <div className="mt-4 text-xs text-ember/90 break-words">
            Reason: {adminErr}
          </div>
        )}
        <div className="mt-3 text-xs text-cream/50">
          If the role was just granted in Supabase, hit Re-check. If this keeps failing with a
          network/timeout reason, disable Brave Shields / ad-blockers for this site and retry.
        </div>
        <button
          onClick={async () => {
            setRechecking(true);
            try { await refreshAdmin(session.user.id); } finally { setRechecking(false); }
          }}
          disabled={rechecking}
          className="mt-6 mr-3 px-4 py-2 rounded-full bg-ember text-cream text-sm disabled:opacity-50"
        >{rechecking ? 'Checking…' : 'Re-check role'}</button>
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
  return (
    <AdminErrorBoundary>
      <AdminDashboard user={session.user} />
    </AdminErrorBoundary>
  );
}

// Catches render crashes inside the dashboard and shows the actual error
// with a reload button, instead of a blank screen.
class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[admin] crashed:', error, info?.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center bg-base text-cream px-6">
        <div className="max-w-xl text-center">
          <div className="eyebrow text-ember">Control Panel</div>
          <h1 className="serif text-4xl mt-3 mb-4">Something broke</h1>
          <p className="text-cream/70 text-sm leading-relaxed break-words">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-5 py-2.5 rounded-full bg-cream text-ink text-sm font-medium"
          >Reload panel</button>
        </div>
      </div>
    );
  }
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
