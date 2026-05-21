import { useEffect, useState } from 'react';
import { supabase, supabaseEnabled } from './supabase.js';
import { TREK_PRICES, formatINR } from './treks.js';

// Default trek rotation for the homepage departures table.
// Admin can override entirely by adding rows to public.batches.
const DEFAULT_FEATURED = [
  { trek_id: 'kudremukh', trek_label: 'Kudremukh' },
  { trek_id: 'netravati', trek_label: 'Netravati' },
  { trek_id: 'bandaje', trek_label: 'Bandaje' },
  { trek_id: 'kumara-parvatha', trek_label: 'Kumara Parvatha' },
  { trek_id: 'kurinjal', trek_label: 'Kurinjal' }
];

/**
 * Returns the next N Friday→Sunday weekend ranges starting from
 * the next Friday (skipping today if today is Friday).
 */
export function getNextWeekends(count = 5, fromDate = new Date()) {
  const now = new Date(fromDate);
  now.setHours(0, 0, 0, 0);
  const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri
  const daysUntilFriday = ((5 - dayOfWeek + 7) % 7) || 7; // next Friday (always future)

  const result = [];
  for (let i = 0; i < count; i++) {
    const fri = new Date(now);
    fri.setDate(now.getDate() + daysUntilFriday + i * 7);
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    result.push({ start: fri, end: sun });
  }
  return result;
}

/**
 * "Dec 14-15"  (same month)
 * "Nov 30-Dec 2"  (cross-month)
 */
export function formatDateRange(start, end) {
  const monthFmt = { month: 'short' };
  const sameMonth = start.getMonth() === end.getMonth();
  const sm = start.toLocaleDateString('en-US', monthFmt);
  const em = end.toLocaleDateString('en-US', monthFmt);
  if (sameMonth) {
    return `${sm} ${start.getDate()}-${end.getDate()}`;
  }
  return `${sm} ${start.getDate()}-${em} ${end.getDate()}`;
}

const toISO = (d) => d.toISOString().slice(0, 10); // 'YYYY-MM-DD'

/**
 * Pulls live batches from Supabase if configured.
 * Falls back to: featured 5 treks × next 5 weekends (auto-rolling).
 */
export function useBatches() {
  const [batches, setBatches] = useState(() => generateDefaults());
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;

    (async () => {
      const todayISO = toISO(new Date());
      const { data, error } = await supabase
        .from('batches')
        .select('id, trek_id, trek_label, start_date, end_date, date_label, price, is_active')
        .eq('is_active', true)
        .gte('start_date', todayISO)
        .order('start_date', { ascending: true })
        .limit(8);

      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setBatches(generateDefaults());
      } else {
        setBatches(
          data.map((row) => ({
            trek: row.trek_label || trekIdToLabel(row.trek_id),
            trek_id: row.trek_id,
            date: row.date_label || formatRangeFromISO(row.start_date, row.end_date),
            price: row.price != null ? formatINR(row.price) : formatINR(TREK_PRICES[row.trek_id])
          }))
        );
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { batches, loading };
}

function trekIdToLabel(id) {
  if (!id) return '';
  return id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function formatRangeFromISO(startISO, endISO) {
  if (!startISO) return '';
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : new Date(start.getTime() + 2 * 86400000);
  return formatDateRange(start, end);
}

function generateDefaults() {
  const weekends = getNextWeekends(DEFAULT_FEATURED.length);
  return DEFAULT_FEATURED.map((t, i) => ({
    trek: t.trek_label,
    trek_id: t.trek_id,
    date: formatDateRange(weekends[i].start, weekends[i].end),
    price: formatINR(TREK_PRICES[t.trek_id])
  }));
}
