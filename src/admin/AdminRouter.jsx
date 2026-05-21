import { useEffect, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase.js';
import AdminLogin from './Login.jsx';
import AdminDashboard from './Dashboard.jsx';

const SESSION_IDLE_MINUTES = 30;

export default function AdminRouter() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await verifyAdmin(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) await verifyAdmin(s.user.id);
      else setIsAdmin(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let lastActivity = Date.now();
    const reset = () => { lastActivity = Date.now(); };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    const interval = setInterval(() => {
      const idle = (Date.now() - lastActivity) / 60000;
      if (idle > SESSION_IDLE_MINUTES) {
        supabase?.auth.signOut();
      }
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearInterval(interval);
    };
  }, [session]);

  async function verifyAdmin(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (!error && data?.role === 'admin') setIsAdmin(true);
    else setIsAdmin(false);
  }

  if (!supabaseEnabled) {
    return (
      <SetupGate>
        Supabase isn't configured yet. Create a project, run <code>supabase/schema.sql</code>, then
        set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>.
      </SetupGate>
    );
  }

  if (loading) return <FullScreen>Loading…</FullScreen>;

  if (!session) return <AdminLogin />;

  if (!isAdmin) {
    return (
      <SetupGate>
        Signed in, but this account doesn't have admin role. Open the SQL editor in
        Supabase and run: <code>update public.profiles set role = 'admin' where id = '{session.user.id}';</code>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-6 px-4 py-2 rounded-full bg-white text-ink text-sm"
        >Sign out</button>
      </SetupGate>
    );
  }

  return <AdminDashboard user={session.user} />;
}

function FullScreen({ children }) {
  return <div className="min-h-screen grid place-items-center bg-base text-cream">{children}</div>;
}

function SetupGate({ children }) {
  return (
    <div className="min-h-screen grid place-items-center bg-base text-cream px-6">
      <div className="max-w-xl text-center">
        <div className="eyebrow text-ember">Control Room</div>
        <h1 className="serif text-4xl mt-3 mb-6">Setup required</h1>
        <div className="text-cream/80 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
