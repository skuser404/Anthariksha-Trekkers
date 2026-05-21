import { useEffect, useState } from 'react';
import { supabase, supabaseEnabled } from './supabase.js';

// Static price fallback. Used when Supabase is not configured OR
// a specific trek hasn't been overridden in the DB yet.
// Update prices through the admin panel (/control-room) once live.
export const TREK_PRICES = {
  kudremukh: 4499,
  netravati: 4499,
  bandaje: 4100,

  kodachadri: 4799,
  tadiandamol: 3699,
  'kumara-parvatha': 4999,
  skandagiri: 1899,
  'kunti-betta': 2199,
  'ettina-bhuja': 3799,
  mullayanagiri: 3499,
  'narasimha-parvatha': 4699,
  gokarna: 4899,
  dudhsagar: 4299,
  kurinjal: 3899,
  'ballalarayana-durga': 4299,

  'chikmagalur-backpacking': 6499,
  coorg: 6999,
  wayanad: 7299,
  meghalaya: 28999,
  'himalayan-basecamp': 19999
};

export const formatINR = (n) => {
  if (n == null || Number.isNaN(Number(n))) return '';
  return `₹${Number(n).toLocaleString('en-IN')}`;
};

/**
 * Pulls live trek overrides from Supabase if configured.
 * Merges them on top of the static `defaults` array, preserving
 * ordering and any local field (image, itinerary, etc.) the DB
 * doesn't override. If Supabase is disabled, returns defaults
 * untouched so the marketing site keeps working offline.
 */
export function useLiveTreks(defaults) {
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('treks')
        .select('id, name, price, difficulty, altitude, duration, distance, best_season, from_bangalore, tag, is_active, is_open');
      if (cancelled || error || !data) return;

      const map = {};
      for (const row of data) {
        if (row.is_active === false) continue;
        map[row.id] = {
          name: row.name,
          price: row.price,
          difficulty: row.difficulty,
          altitude: row.altitude,
          duration: row.duration,
          distance: row.distance,
          bestSeason: row.best_season,
          fromBangalore: row.from_bangalore,
          tag: row.tag,
          isOpen: row.is_open !== false  // null/true → open, false → closed
        };
      }
      setOverrides(map);
    })();

    return () => { cancelled = true; };
  }, []);

  const treks = defaults.map((t) => {
    const o = overrides[t.id];
    if (!o) return t;
    // Only override fields the DB actually has (non-null)
    const next = { ...t };
    for (const k of Object.keys(o)) {
      if (o[k] != null && o[k] !== '') next[k] = o[k];
    }
    return next;
  });

  return { treks, isLive: supabaseEnabled && Object.keys(overrides).length > 0 };
}
