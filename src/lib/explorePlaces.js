/**
 * Curated nearby-explore locations. Images served directly from /public.
 * Each location has a `slug` that is referenced by treks via TREK_NEARBY_MAP.
 */
export const EXPLORE_PLACES = [
  {
    slug: 'horanadu',
    name: 'Horanadu Annapoorneshwari Temple',
    region: 'Horanadu · Karnataka',
    type: 'Temple',
    image: '/Horanadu TEMPLE VIEW.webp',
    description: 'Sacred temple surrounded by misty Western Ghats forests, known for its divine atmosphere and free prasada meals for devotees.',
    highlights: ['Free prasada', 'Spiritual atmosphere', 'River-side location', 'Mountain surroundings']
  },
  {
    slug: 'kalaseshwara',
    name: 'Kalaseshwara Swamy Temple',
    region: 'Kalasa · Karnataka',
    type: 'Temple',
    image: '/Kalasheshwaraswamy-Temple-Kalasa-Chikmagalur.jpg',
    description: 'Ancient Dakshina Kashi temple overlooking the Bhadra River, rich with mythology and peaceful hilltop views.',
    highlights: ['Dakshina Kashi', 'Shiva temple', 'Hilltop views', 'Historic architecture']
  },
  {
    slug: 'hanging-bridge',
    name: 'Kalasa Hanging Bridge',
    region: 'Kalasa · Karnataka',
    type: 'Riverside',
    image: '/Hanging-Bridge-in-Kalasa 1.png',
    description: 'Scenic suspension bridge floating above the Bhadra River with panoramic forest and river views.',
    highlights: ['Suspension bridge', 'Cinematic photography spot', 'River views', 'Relaxing atmosphere']
  },
  {
    slug: 'samse-tea',
    name: 'Samse Tea Estate',
    region: 'Chikmagalur · Karnataka',
    type: 'Plantation',
    image: '/images/misty-trees.jpg',
    description: 'Rolling emerald-green tea gardens surrounded by mist-covered Western Ghats landscapes.',
    highlights: ['Tea gardens', 'Misty landscapes', 'Photography spot', 'Scenic drive route']
  },
  {
    slug: 'somavathi-falls',
    name: 'Somavathi Falls',
    region: 'Kudremukh Range · Karnataka',
    type: 'Waterfall',
    image: '/images/waterfall.jpg',
    description: 'Refreshing waterfall near the Kudremukh trekking base, surrounded by dense forest and rocky streams.',
    highlights: ['Waterfall', 'Trekking base point', 'River stream', 'Forest atmosphere']
  }
];

/**
 * Trek ID → array of location slugs.
 * Treks not listed fall back to a sensible default (all 5).
 */
export const TREK_NEARBY_MAP = {
  'kudremukh':       ['somavathi-falls', 'samse-tea', 'hanging-bridge'],
  'netravati':       ['samse-tea', 'horanadu'],
  'kurinjal':        ['kalaseshwara', 'hanging-bridge'],
  'kumara-parvatha': ['horanadu', 'samse-tea'],
  'bandaje':         ['hanging-bridge', 'samse-tea'],
  'kodachadri':      ['horanadu', 'somavathi-falls'],
  'tadiandamol':     ['kalaseshwara'],
  'ettina-bhuja':    ['hanging-bridge', 'samse-tea'],
  'mullayanagiri':   ['kalaseshwara', 'samse-tea'],
  'ballalarayana-durga': ['hanging-bridge', 'kalaseshwara']
};

export function getNearbyPlaces(trekId) {
  const slugs = TREK_NEARBY_MAP[trekId];
  if (!slugs || slugs.length === 0) return EXPLORE_PLACES; // default: show all
  return slugs
    .map((s) => EXPLORE_PLACES.find((p) => p.slug === s))
    .filter(Boolean);
}
