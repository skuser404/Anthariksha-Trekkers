import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anon);

export const supabase = supabaseEnabled
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'anth-auth',
        flowType: 'pkce'
      },
      global: {
        headers: { 'x-client-info': 'anthariksha-web' }
      }
    })
  : null;

if (!supabaseEnabled && typeof window !== 'undefined') {
  // Silent in production — only warn during local dev
  if (import.meta.env.DEV) {
    console.info('[supabase] env vars not set — site running in static mode');
  }
}
