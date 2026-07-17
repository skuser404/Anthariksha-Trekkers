import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Mountain, TrendingUp, Calendar, Check, ArrowRight, Sun, Navigation, Tag } from 'lucide-react';
import { TREK_PRICES, useLiveTreks, formatINR } from '../lib/treks.js';
import { openBooking } from './BookingModal.jsx';
import { toDriveImageURL } from '../lib/drive.js';
import DriveImage from './DriveImage.jsx';
import TrekSlideshow from './TrekSlideshow.jsx';
import TrekGuidelines from './TrekGuidelines.jsx';
import NearbyExplore from './NearbyExplore.jsx';

const IMG = {
  sunrise: '/images/hero-sunrise.jpg',
  ridge: '/images/ridge-peak.jpg',
  cliff: '/images/cliff-summit.jpg',
  green: '/images/green-ridge.jpg',
  fall: '/images/waterfall.jpg',
  sky: '/images/blue-sky-ridge.jpg',
  stream: '/images/forest-stream.jpg',
  misty: '/images/misty-trees.jpg'
};

const lockBackgroundScroll = (locked) => {
  if (typeof window === 'undefined') return;
  if (locked) {
    window.__lenis?.stop();
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
    window.__lenis?.start();
  }
};

const smoothScrollTo = (target, offset = -80) => {
  if (!target) return;
  if (window.__lenis?.scrollTo) {
    window.__lenis.scrollTo(target, { offset, duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const treks = [
  {
    id: 'kudremukh',
    name: 'Kudremukh Trek',
    region: 'Chikmagalur · Karnataka',
    image: IMG.ridge,
    duration: '2 Days',
    difficulty: 'Moderate',
    altitude: '1,894 m',
    distance: '22 km',
    bestSeason: 'Sept–Feb',
    fromBangalore: '330 km',
    tag: 'Where the ridge meets the sky.',
    story: [
      'Kudremukh rises through layers of rolling grasslands, cloud forests, hidden streams, and mist-covered ridgelines. Every trail feels untouched — silent except for the sound of wind moving through the Western Ghats.',
      'You cross seven hills before the summit reveals itself. By then the valley has filled with cloud, and the only sound left is your own breath.',
      'This is the trek that began it all for us. Two days in, you understand why.'
    ],
    highlights: [
      'Seven rolling hills, shola cloud-forests, and stream crossings on the way to the summit',
      'Inside Kudremukh National Park — one of the Western Ghats\' last unbroken biodiversity belts',
      'The classic "horse-face" silhouette at 1,894 m — visible from the ridge before you reach it',
      'Homestay night in Mullodi village — home-cooked meals, no rough camping',
      'Sunrise viewpoint walk on Sunday morning before departure'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9:30 PM pickup from Majestic, Bangalore', 'Overnight drive via Samse Tea Estate & Horanadu temple', 'Reach Kalasa/Mullodi homestay by 6 AM'] },
      { day: 'Day 1 · Saturday', title: 'Summit Day', items: ['Breakfast at the homestay', 'Jeep ride to Mullodi trek base', 'Begin trek 7:30 AM through shola forest', 'Cross 7 rolling hills, grasslands & streams', 'Packed lunch at the summit', 'After having lunch, descent starts', 'Reach base by 5:30 PM', 'Homestay dinner + bonfire'] },
      { day: 'Day 2 · Sunday', title: 'Sunrise & Return', items: ['6 AM sunrise viewpoint walk', 'Homestay breakfast', 'Depart 10 AM', 'Reach Bangalore overnight'] }
    ]
  },
  {
    id: 'kodachadri',
    name: 'Kodachadri Trek',
    region: 'Shimoga · Karnataka',
    image: IMG.sunrise,
    duration: '2 Days',
    difficulty: 'Moderate',
    altitude: '1,343 m',
    distance: '18 km',
    bestSeason: 'Oct–Feb',
    fromBangalore: '410 km',
    tag: 'Sunset peak of the Sahyadris.',
    highlights: [
      'Sarvajna Peetha — Adi Shankaracharya\'s meditation spot',
      'Hidlumane Falls mid-route swim stop',
      'Spectacular sunset over the Arabian Sea',
      'Open-jeep return ride (the "dangerously awesome" jeep trek)',
      'Mookambika Wildlife Sanctuary trails'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['10 PM pickup from Bangalore', 'Overnight transit to Kollur base'] },
      { day: 'Day 1 · Saturday', title: 'Trek to Summit', items: ['7 AM arrive at Nittur / Karigatte base', 'Breakfast + brief', 'Trek begins 8 AM via dense shola', 'Hidlumane Falls swim break', 'Reach Sarvajna Peetha by 3 PM', 'Sunset at Kodachadri peak', 'Homestay night at Kattinakaru'] },
      { day: 'Day 2 · Sunday', title: 'Descent & Return', items: ['Breakfast at homestay', 'Open-jeep descent down the ghat road', 'Lunch at Hosanagara', 'Reach Bangalore by 10 PM'] }
    ]
  },
  {
    id: 'tadiandamol',
    name: 'Tadiandamol Trek',
    region: 'Coorg · Karnataka',
    image: IMG.green,
    duration: '1 Day',
    difficulty: 'Moderate',
    altitude: '1,748 m',
    distance: '12 km',
    bestSeason: 'Oct–Mar',
    fromBangalore: '265 km',
    tag: "Coorg's highest peak. Second-highest in Karnataka.",
    highlights: [
      'Nalknad Palace start (historic Haleri dynasty fort)',
      'Coffee estate trails into shola forests',
      'Mist-laden grasslands near the summit',
      'Panoramic views of Coorg coffee country',
      'Doable as a single-day Bangalore weekend'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['10:30 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Summit & Return', items: ['6 AM reach Kakkabe base', 'Breakfast at homestay', 'Drive to Nalknad Palace, trek begins 7:30 AM', 'Climb through coffee estates → shola forests → grasslands', 'Summit by 11 AM (~3 hr climb), lunch + photos on top', 'After having lunch, descent starts', 'Reach base by 3 PM', 'Coffee at the estate, depart 5 PM', 'Reach Bangalore by 1 AM'] }
    ]
  },
  {
    id: 'kumara-parvatha',
    name: 'Kumara Parvatha Trek',
    region: 'Kukke Subramanya · Karnataka',
    image: IMG.cliff,
    duration: '2 Days',
    difficulty: 'Tough',
    altitude: '1,712 m',
    distance: '26 km',
    bestSeason: 'Oct–Feb',
    fromBangalore: '285 km',
    tag: "South India's toughest forest climb.",
    highlights: [
      'Kukke Subramanya Temple (Naga shrine) at the base',
      'Bhattara Mane — legendary trekker\'s homestay (mandatory food stop)',
      'Kallu Mantapa viewpoint',
      'Twin summit: Shesha Parvatha → Kumara Parvatha',
      'Steepest, most relentless climb in South India'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9 PM pickup from Bangalore'] },
      { day: 'Day 1 · Saturday', title: 'Climb to Bhattara Mane', items: ['6 AM reach Kukke Subramanya', 'Breakfast + forest permits', 'Start trek 8 AM (7 km steep forest climb)', 'Reach Bhattara Mane homestay by 1 PM', 'Lunch at Bhattara Mane (the famous meal)', 'After having lunch, rest + view Shesha Parvatha', 'Optional sunset at Kallu Mantapa viewpoint', 'Camp / rest house night near Shesha base'] },
      { day: 'Day 2 · Sunday', title: 'Summit Push & Descent', items: ['4 AM start with headlamps', 'Sunrise on Shesha Parvatha', '3 km summit push to Kumara Parvatha peak', 'Packed breakfast on the summit', 'After having lunch on top, descent starts', 'Long 10 km descent back to Kukke', 'Late lunch at base, depart 5 PM'] }
    ]
  },
  {
    id: 'netravati',
    name: 'Netravati Peak Trek',
    region: 'Samse · Karnataka',
    image: IMG.cliff,
    duration: '2 Days',
    difficulty: 'Difficult',
    altitude: '1,513 m',
    distance: '20 km',
    bestSeason: 'Aug–Feb',
    fromBangalore: '320 km',
    tag: 'Where clouds spill over the cliff.',
    highlights: [
      '30-min complimentary open-jeep ride from homestay to the trek base — your rugged Ghats welcome',
      'Experienced trek lead with every batch — small-group pacing, real safety, personalised attention',
      'Comfortable tent stay (double / triple sharing) with mattresses + sleeping bags',
      'Pick your package — Trek-only or Trek + Bangalore transport. Camping, meals, permits & jeep ride included in both',
      'Cross through Kudremukh National Park — shola grasslands, perennial streams, ridge walks, 1,520 m summit'
    ],
    included: ['Transport', 'Meals', 'Sightseeing', 'Permits', 'Trek Lead', 'Stay', 'Trekking', 'Cashback'],
    pickupPoints: [
      { name: 'Indiranagar', detail: 'KFC Road', time: '9:00–9:20 PM' },
      { name: 'Domlur', detail: 'Union Bank', time: '9:30–9:40 PM' },
      { name: 'Yeshwantpur', detail: 'Metro Station entrance', time: '9:20–9:30 PM' },
      { name: 'Goraguntepalya', detail: 'People Tree Hospitals', time: '10:45–10:50 PM' }
    ],
    thingsToCarry: [
      'Trekking shoes', 'Warm layers', 'Raincoat / rain cover', 'Backpack (waterproof lined)',
      'Head torch + spare batteries', 'LED torch', 'Personal medical kit', 'Mosquito repellent',
      'Water bottle / hydration pack', 'Extra clothes', 'Comfortable clothes', 'Towel',
      'Camera', 'Power bank', 'Sunscreen (SPF 40+)', 'Valid photo ID'
    ],
    knowBeforeYouGo: [
      'Every trekker must e-sign the Trekking Acknowledgement & Terms form (emailed right after booking) before departure',
      'Itinerary may shift between exploration day and trek day based on weather, permits, or on-ground conditions. Total distance, meal plan, and return timing stay the same.',
      'Bus is non-AC with push-back seats — boarding is first-come, first-served. Confirmed pickup times are shared 4–6 hours before departure.',
      'Meals are simple South-Indian homestyle (vegetarian by default). Dietary restrictions / allergies must be flagged 48 hours before departure.',
      'Homestay rooms are shared (4–6 trekkers per room) with shared washrooms on vacancy basis.',
      'Optional tent stay on the homestay rooftop with mattress — may be cancelled by the trek lead in case of heavy rain or logistical reasons.',
      'Complimentary jeep segments are offered, but we hold no liability for route changes, delays, or cancellations due to weather or road conditions.',
      'Jeep seating is open-air on rough terrain — expect dust, bumps, and full exposure to the elements.',
      'Carry valid photo ID at all times — forest staff may deny entry for prohibited items or missing documents (no refunds or alternates in such cases).',
      'Trek pace and descent timings are set by the lead based on terrain, weather, group fitness, and visibility.',
      'Bring your own protective gear — sturdy footwear, raincoat, hydration pack, energy snacks.',
      'Monsoon treks come with risks — slippery trails and leeches are common. Follow the lead\'s instructions at all times.',
      'Expected return to Bangalore is between Sunday midnight and 5 AM. Traffic, roadworks, or toll delays may extend this — no refunds for late arrivals.',
      'Loss, theft, or damage to personal belongings is the participant\'s responsibility — we are not liable for items left unattended in campsites or vehicles.',
      'Mid-journey cancellation (weather / official notice) — an alternate weekend trek will be arranged.',
      'Pre-departure cancellation (before the bus leaves) — choose another available trek the same date, reschedule, or take a full wallet refund.',
      'Anthariksha Trekkers acts as a facilitator between you and independent service providers (homestay, transport, jeep). We are not liable for injury, illness, delay, loss, or dissatisfaction arising from external factors.'
    ],
    faqs: [
      {
        q: 'Is the Netravati trek difficult?',
        a: 'Easy to moderate. There are no extreme sections, but you\'ll cross steep ascents, uneven terrain, and ridge walks. Sturdy trekking shoes and a trekking pole are strongly recommended.'
      },
      {
        q: 'How long is the Netravathi Peak trek?',
        a: 'About 13–14 km of actual trekking spread over 2 nights and 1 main trekking day. The route starts from the edge of Kudremukh National Park and climbs through dense forest, valleys, and waterfalls before reaching the summit.'
      },
      {
        q: 'Kudremukh vs Netravati — which is better?',
        a: 'Netravati is the gentler weekend — around 14 km, lush forest, perennial streams, ideal for first-time and moderate trekkers. Kudremukh is the bigger climb — 20+ km, longer endurance days, broader vistas. Pick Netravati if it\'s your first Ghats trek, Kudremukh if you want the bigger payoff.'
      }
    ],
    policies: {
      confirmation: [
        'You receive a booking confirmation voucher by email within 24 hours of payment.',
        'If your preferred batch is unavailable, we offer an alternate batch of your preference and send a fresh confirmation voucher.',
        'You may also choose to cancel pre-confirmation for a full refund.'
      ],
      cancellation: [
        '60+ days before the travel date · 10% of total tour cost is charged as cancellation fee',
        '30–60 days before · 25% of total tour cost is charged',
        '15–30 days before · 50% of total tour cost is charged',
        '7–15 days before · 75% of total tour cost is charged',
        '0–7 days before · 100% of total tour cost is charged',
        'In case of unforeseen weather, union issues, government restrictions, or any other force-majeure event, the trek may be cancelled. Alternate feasible options will be offered — cash refunds are not available in such cases.'
      ]
    },
    itinerary: [
      { day: 'Day 1 · Friday', title: 'Departure from Bangalore', items: [
        '9:00 PM — overnight pickup from Bangalore',
        'Boarding · Decathlon Sports, Brigade Road',
        'Boarding · Yeshwanthpur Metro Station entrance',
        'Boarding · Goraguntepalya, People Tree Hospitals',
        'Meet your group, settle in for the overnight ride to the Western Ghats'
      ] },
      { day: 'Day 2 · Saturday', title: 'Homestay Arrival & Local Exploration', items: [
        '6:00 AM — reach the homestay near Samse',
        'Freshen up, hot breakfast at the homestay',
        'Visit Samse Tea Estate — rolling green plantations, photo stop',
        'Kalasa Hanging Bridge — quiet riverside walk + scenic views',
        'Kalasa Temple — ancient Shiva shrine',
        'Horanadu Temple darshan',
        'Somavathi River — relax by the calm waters',
        'Return to homestay · evening leisure + dinner',
        'Early sleep — trek day tomorrow'
      ] },
      { day: 'Day 3 · Sunday', title: 'Netravathi Peak Trek & Return', items: [
        '6:00 AM start from the homestay',
        'Drive to the trek base, begin ascent towards Netravathi Peak',
        'Trail through dense forest sections → open grasslands → ridge walks',
        'Reach the peak — panoramic Western Ghats views',
        'After lunch on the peak, descent starts',
        'Return to homestay for a freshly prepared lunch',
        'Pack up, depart by afternoon',
        'Expected arrival in Bangalore late night'
      ] }
    ]
  },
  {
    id: 'skandagiri',
    name: 'Skandagiri Sunrise Trek',
    region: 'Chikkaballapur · Karnataka',
    image: IMG.sunrise,
    duration: '1 Night',
    difficulty: 'Easy',
    altitude: '1,450 m',
    distance: '8 km',
    bestSeason: 'Year-round',
    fromBangalore: '60 km',
    tag: 'Sunrise above the clouds. 60 km from Bangalore.',
    highlights: [
      'Tipu Sultan\'s ruined hill fort at the summit',
      'Sea of clouds at sunrise (the famous "above the clouds" view)',
      'Headlamp night ascent — treacherous rocky boulders',
      'Closest big-sunrise trek to Bangalore',
      'Papagani Temple start point'
    ],
    itinerary: [
      { day: 'Saturday Night', title: 'Night Climb', items: ['11 PM pickup from Bangalore', '1 AM reach Papagani Temple base', 'Brief + light snack', 'Trek begins 1:30 AM with torchlight', '90-minute steep rocky ascent', 'Reach summit (fort ruins) by 4 AM'] },
      { day: 'Sunday Morning', title: 'Sunrise & Return', items: ['Rest at the ruined fort', 'Sunrise above the cloud sea (5:30–6:30 AM)', 'Photos + breakfast on top', 'Descend by 8:30 AM', 'Reach Bangalore by noon'] }
    ]
  },
  {
    id: 'kunti-betta',
    name: 'Kunti Betta Night Trek',
    region: 'Pandavapura · Karnataka',
    image: IMG.sky,
    duration: '1 Night',
    difficulty: 'Easy',
    altitude: '882 m',
    distance: '6 km',
    bestSeason: 'Year-round',
    fromBangalore: '125 km',
    tag: 'Stars, summit, sunrise. One night.',
    highlights: [
      'Twin-peak hillock with massive boulders',
      'Mahabharata legend setting — where Kunti (Pandava mother) lived',
      'Lake at base for coracle ride / swim',
      'Brilliant stargazing — minimal light pollution',
      'Bonfire + camp dinner'
    ],
    itinerary: [
      { day: 'Saturday Night', title: 'Camp + Climb', items: ['9 PM pickup from Bangalore', '12 AM reach lakeside camp', 'Bonfire dinner + stargazing', 'Trek start 3 AM (1.5 hr boulder ascent)', 'Reach summit by 5 AM'] },
      { day: 'Sunday Morning', title: 'Sunrise & Lake', items: ['Sunrise from the summit', 'Descent + breakfast at camp', 'Optional coracle ride / kayaking on the lake', 'Depart 11 AM, reach Bangalore by 4 PM'] }
    ]
  },
  {
    id: 'ettina-bhuja',
    name: 'Ettina Bhuja Trek',
    region: 'Charmadi · Karnataka',
    image: IMG.ridge,
    duration: '1 Day',
    difficulty: 'Moderate',
    altitude: '1,300 m',
    distance: '10 km',
    bestSeason: 'Sept–Feb',
    fromBangalore: '280 km',
    tag: "The bull's shoulder of the Ghats.",
    highlights: [
      'Shape resembles a bull\'s shoulder (Ettina Bhuja = "Bull\'s Shoulder")',
      'Nanya Byraveshwara temple start',
      'Mixed forest → open grassland climb',
      'Steep, windy final leg to the summit',
      '360° Western Ghats panorama'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['10 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Summit & Return', items: ['5:30 AM reach Byrapura village', 'Breakfast at a local home', 'Trek begins 7 AM from Nanya Byraveshwara temple', 'Climb through mixed forest + grasslands', 'Steep windy final leg', 'Reach summit by 11 AM, lunch on top + photos', 'After having lunch, descent starts', 'Reach base by 3 PM', 'Reach Bangalore by 11 PM'] }
    ]
  },
  {
    id: 'mullayanagiri',
    name: 'Mullayanagiri Trek',
    region: 'Chikmagalur · Karnataka',
    image: IMG.sky,
    duration: '1 Day',
    difficulty: 'Easy-Moderate',
    altitude: '1,930 m',
    distance: '8 km',
    bestSeason: 'Sept–Mar',
    fromBangalore: '260 km',
    tag: "Karnataka's highest peak. The summit Shiva temple.",
    highlights: [
      'Highest peak in Karnataka (1,930 m)',
      'Small Shiva temple at the summit',
      'Nandi statue, caves, streams en route',
      'Sarpadhari ridge walk approach',
      'Chandra Drona Hill Range + coffee country views'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['10:30 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Summit Day', items: ['6 AM reach Sarpadhari trek base', 'Breakfast at the homestay', 'Trek begins 7:30 AM (3-4 km, ~3 hr ascent)', 'Pass Nandi statue, caves, streams en route', 'Summit Shiva temple visit by 10:30 AM', 'Lunch + photos on top', 'After having lunch, descent starts (~1.5 hr)', 'Optional Baba Budangiri drive', 'Depart 4 PM, reach Bangalore midnight'] }
    ]
  },
  {
    id: 'narasimha-parvatha',
    name: 'Narasimha Parvatha Trek',
    region: 'Agumbe · Karnataka',
    image: IMG.stream,
    duration: '2 Days',
    difficulty: 'Moderate',
    altitude: '826 m',
    distance: '24 km',
    bestSeason: 'Oct–Feb',
    fromBangalore: '380 km',
    tag: 'Through king cobra country — the Cherrapunji of the South.',
    highlights: [
      'Agumbe Rainforest — India\'s king cobra capital',
      'Crown jewel of Agumbe at the summit',
      'Dense canopy biodiversity hotspot',
      'Choice of routes: Malandur (harder) or Kigga (easier)',
      'Optional Sringeri Sharadamba Temple visit'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9 PM pickup from Bangalore'] },
      { day: 'Day 1 · Saturday', title: 'Forest Climb', items: ['6 AM reach Kigga / Sringeri', 'Breakfast at the homestay', 'Trek begins 8 AM via the Agumbe rainforest', 'Dense canopy + stream crossings', 'Reach the summit by 1 PM, lunch on top', 'After having lunch, descent starts', 'Descend halfway to homestay near the base'] },
      { day: 'Day 2 · Sunday', title: 'Agumbe + Return', items: ['Breakfast', 'Agumbe sunset point + Onake Abbi falls', 'Optional Sringeri temple visit', 'Depart 3 PM', 'Reach Bangalore by 11 PM'] }
    ]
  },
  {
    id: 'gokarna',
    name: 'Gokarna Beach Trek',
    region: 'Karwar Coast · Karnataka',
    image: IMG.fall,
    duration: '2 Days',
    difficulty: 'Easy',
    altitude: 'Sea Level',
    distance: '14 km',
    bestSeason: 'Oct–Mar',
    fromBangalore: '480 km',
    tag: 'Five beaches. One coastline. Bare feet.',
    highlights: [
      'Five iconic beaches: Gokarna → Kudle → Om → Half-Moon → Paradise',
      'Cliff-side trails with Arabian Sea views',
      'Mahabaleshwara Temple (Atmalinga shrine)',
      'Bonfires + cliff jumping at Half-Moon Beach',
      'Beach-shack stay'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9 PM pickup from Bangalore'] },
      { day: 'Day 1 · Saturday', title: 'Beach Hike', items: ['7 AM reach Gokarna town', 'Mahabaleshwara Temple visit', 'Drop bags + breakfast', 'Begin coastal walk 9 AM from Gokarna Beach', 'Cliff trail to Kudle → Om Beach', 'Lunch at Om Beach', 'Continue to Half-Moon + Paradise Beach', 'Camp/shack stay + sunset + dinner'] },
      { day: 'Day 2 · Sunday', title: 'Town + Return', items: ['Sunrise on Kudle Beach', 'Return walk to Gokarna town', 'Optional Mirjan Fort / Yana caves stop', 'Cafe brunch in town', 'Depart 3 PM, reach Bangalore midnight'] }
    ]
  },
  {
    id: 'bandaje',
    name: 'Bandaje Falls Trek',
    region: 'Charmadi · Karnataka',
    image: IMG.fall,
    duration: '2 Days',
    difficulty: 'Difficult',
    altitude: '1,054 m',
    distance: '24 km',
    bestSeason: 'Oct–Feb',
    fromBangalore: '290 km',
    tag: 'A 200-foot drop into the wild.',
    highlights: [
      '200-foot waterfall plunging into a hidden valley',
      'Bird\'s-eye view of the entire valley from the top',
      'Dense evergreen forest + cliff-edge grasslands',
      'Often combined with Ballalarayana Durga ridgeline',
      'Untouched Charmadi reserve trails'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9 PM pickup from Bangalore'] },
      { day: 'Day 1 · Saturday', title: 'To the Edge', items: ['6 AM reach Ujire / Sunkasale', 'Breakfast at a local home', 'Drive to Belthangady → Sunkasale', 'Trek begins 8 AM through Charmadi reserve forest', 'Reach Bandaje grassland camp by 2 PM', 'Walk to the cliff-edge waterfall (bird\'s-eye view)', 'Camp dinner under the stars'] },
      { day: 'Day 2 · Sunday', title: 'Descent & Return', items: ['Sunrise on the cliff', 'Breakfast + pack up', 'Descend through bamboo + shola by 1 PM', 'After having lunch at village, descent continues', 'Lunch at Sunkasale homestay', 'Depart 4 PM, reach Bangalore by midnight'] }
    ]
  },
  {
    id: 'kurinjal',
    name: 'Kurinjal Peak Trek',
    region: 'Kudremukh Range · Karnataka',
    image: IMG.green,
    duration: '1 Day',
    difficulty: 'Moderate',
    altitude: '1,573 m',
    distance: '12 km',
    bestSeason: 'Sept–Feb',
    fromBangalore: '335 km',
    tag: 'The quieter ridge of Kudremukh.',
    highlights: [
      'Less crowded sibling of Kudremukh',
      'Inside Kudremukh National Park — protected biodiversity',
      'Bhagavathi Nature Camp start (forest permits required)',
      'Shola-grassland ecosystem',
      'Kalasa & Horanadu temples nearby'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['9:30 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Summit & Return', items: ['6 AM reach Bhagavathi Nature Camp', 'Forest permits + breakfast', 'Trek begins 8 AM with mandatory forest guide', 'Climb through shola → grassland', 'Summit by noon, lunch on the ridge', 'After having lunch, descent starts', 'Reach Bhagavathi camp by 3 PM', 'Reach Bangalore by 11 PM'] }
    ]
  },
  {
    id: 'ballalarayana-durga',
    name: 'Ballalarayana Durga Trek',
    region: 'Charmadi · Karnataka',
    image: IMG.misty,
    duration: '2 Days',
    difficulty: 'Moderate',
    altitude: '1,509 m',
    distance: '22 km',
    bestSeason: 'Oct–Feb',
    fromBangalore: '290 km',
    tag: 'Fort ruins on a ridge of fog.',
    highlights: [
      'Hoysala-era stone-ruin fort on a hilltop',
      'Sunset spot — fog rolling over the ruins',
      'Ridge connecting all the way to Bandaje Falls',
      'Sunbird Tea Estate views',
      'Combo Bandaje + Ballalarayana 2-day expedition option'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9 PM pickup from Bangalore'] },
      { day: 'Day 1 · Saturday', title: 'To the Fort', items: ['6 AM reach Sunkasale / Durgadahalli', 'Breakfast at the homestay', 'Trek begins 8 AM (~3 hr climb)', 'Reach the Hoysala fort ruins by noon', 'Lunch + ridge walk', 'After having lunch, ridge exploration continues', 'Sunset at the fort wall', 'Camp on the meadow'] },
      { day: 'Day 2 · Sunday', title: 'Descent & Return', items: ['Sunrise from the fort wall', 'Optional ridge descent toward Bandaje', 'Descend via tea estate', 'Lunch at the homestay', 'Depart 3 PM, reach Bangalore by midnight'] }
    ]
  },
  {
    id: 'gangadikal',
    name: 'Gangadikal Peak Trek',
    region: 'Kudremukh NP · Karnataka',
    image: IMG.green,
    duration: '1 Day',
    difficulty: 'Moderate',
    altitude: '1,690 m',
    distance: '10 km',
    bestSeason: 'Oct–May',
    fromBangalore: '330 km',
    tag: 'The newest permit trail in Kudremukh — face-on views of the horse-face peak.',
    highlights: [
      'One of the recently opened Forest Department permit trails',
      'Face-on panorama of the Kudremukh "horse-face" ridgeline',
      'Shola forest and grassland climb from the Kalasa side',
      'Forest-guide-led batch (permits + guide arranged by us)',
      'Far quieter than the main Kudremukh trail'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9:30 PM pickup from Bangalore', 'Overnight drive toward Kalasa'] },
      { day: 'Day 1 · Saturday', title: 'Summit & Return', items: ['6 AM reach the base, breakfast', 'Forest check-post permits + guide briefing', 'Trek begins 8 AM through shola and grassland', 'Gangadikal summit — Kudremukh range panorama', 'Packed lunch on top', 'After having lunch, descent starts', 'Evening coffee at Kalasa', 'Depart 6 PM, reach Bangalore overnight'] }
    ]
  },
  {
    id: 'valikunja',
    name: 'Valikunja Trek',
    region: 'Kudremukh NP · Karnataka',
    image: IMG.misty,
    duration: '1 Day',
    difficulty: 'Moderate',
    altitude: '1,300 m',
    distance: '14 km',
    bestSeason: 'Oct–May',
    fromBangalore: '350 km',
    tag: 'The lesser-walked permit ridge inside the national park.',
    highlights: [
      'Official Forest Department permit trail — small batches only',
      'Dense evergreen forest opening onto a grassland ridge',
      'High chance of gaur, giant squirrel, and hornbill sightings',
      'Streams and shola crossings on the Karkala side of the park',
      'Forest guide with every batch'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9:30 PM pickup from Bangalore', 'Overnight drive toward Karkala'] },
      { day: 'Day 1 · Saturday', title: 'Ridge & Return', items: ['6 AM reach the forest office, breakfast', 'Permits + guide allocation', 'Trek begins 8 AM through evergreen forest', 'Valikunja ridge viewpoint, packed lunch', 'After having lunch, loop descent begins', 'Reach base by 4:30 PM', 'Depart 6 PM, reach Bangalore overnight'] }
    ]
  },
  {
    id: 'seethabumi',
    name: 'Seethabumi Peak Trek',
    region: 'Kudremukh NP · Karnataka',
    image: IMG.cliff,
    duration: '1 Day',
    difficulty: 'Moderate',
    altitude: '1,450 m',
    distance: '12 km',
    bestSeason: 'Oct–May',
    fromBangalore: '340 km',
    tag: 'Grassland summit on the quiet side of the Kudremukh range.',
    highlights: [
      'Forest Department permit trail near Kalasa',
      'Rolling grassland ridgelines with valley views on both sides',
      'Mythology-rich peak — named for Sita of the Ramayana',
      'Combines beautifully with Horanadu temple on the return',
      'Small guided batches only'
    ],
    itinerary: [
      { day: 'Day 0 · Friday', title: 'Departure', items: ['9:30 PM pickup from Bangalore', 'Overnight drive toward Kalasa'] },
      { day: 'Day 1 · Saturday', title: 'Summit & Return', items: ['6 AM reach the base village, breakfast', 'Forest permits + guide briefing', 'Trek begins 8 AM up the grassland ridge', 'Seethabumi summit, packed lunch', 'After having lunch, descent starts', 'Horanadu Annapoorneshwari temple stop', 'Depart 6 PM, reach Bangalore overnight'] }
    ]
  },
  {
    id: 'baba-budangiri',
    name: 'Baba Budangiri Trek',
    region: 'Chikmagalur · Karnataka',
    image: IMG.misty,
    duration: '1 Day',
    difficulty: 'Easy-Moderate',
    altitude: '1,895 m',
    distance: '9 km',
    bestSeason: 'Sept–Mar',
    fromBangalore: '270 km',
    tag: "The saint's peak — cave shrine, cliffs, and the Galikere meadow.",
    highlights: [
      'Dattatreya Peetha — the centuries-old cave shrine at the summit',
      'Galikere lake meadow tucked between the ridgelines',
      'Manikyadhara Falls stop on the descent',
      'Ridge views across to Mullayanagiri — Karnataka\'s highest peak',
      'Doable as a single-day Bangalore weekend'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['10:30 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Summit & Return', items: ['5:30 AM reach Chikmagalur, breakfast', 'Drive up the Baba Budangiri ghat road', 'Trek begins 8 AM along the ridge', 'Dattatreya Peetha cave shrine visit', 'Galikere lake meadow + packed lunch', 'After having lunch, descent via Manikyadhara Falls', 'Evening coffee in Chikmagalur town', 'Depart 6 PM, reach Bangalore by midnight'] }
    ]
  },
  {
    id: 'kemmangundi-z-point',
    name: 'Kemmangundi Z-Point Trek',
    region: 'Kemmangundi · Chikmagalur',
    image: IMG.sky,
    duration: '1 Day',
    difficulty: 'Easy',
    altitude: '1,750 m',
    distance: '6 km',
    bestSeason: 'Sept–Mar',
    fromBangalore: '270 km',
    tag: 'A cliff-edge sunrise above the Bhadra valley.',
    highlights: [
      'Z-Point — the cliff-edge viewpoint above the Bhadra forests',
      'Shanti Falls en route to the top',
      'Hebbe Falls jeep ride through coffee estates',
      'Raj Bhavan rose garden viewpoint at Kemmangundi',
      'Kalhatti Falls temple stop on the return'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['10:30 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Z-Point & Falls', items: ['6 AM reach Kemmangundi hill station', 'Sunrise trek to Z-Point via Shanti Falls', 'Breakfast back at Kemmangundi', 'Jeep ride to Hebbe Falls, swim break', 'Lunch at a coffee estate', 'After having lunch, Kalhatti Falls stop', 'Depart 5 PM, reach Bangalore by midnight'] }
    ]
  },
  {
    id: 'deviramma-betta',
    name: 'Deviramma Betta Trek',
    region: 'Chikmagalur · Karnataka',
    image: IMG.green,
    duration: '1 Day',
    difficulty: 'Moderate',
    altitude: '1,200 m',
    distance: '8 km',
    bestSeason: 'Oct–Mar',
    fromBangalore: '260 km',
    tag: 'The bare-rock pilgrim climb opposite Mullayanagiri.',
    highlights: [
      'Devirammana temple at the bare rocky summit',
      'Open grassland-and-rock climb — no forest cover, all views',
      'Face-on panorama of the Mullayanagiri–Baba Budangiri range',
      'Quiet trail — far fewer trekkers than the neighbouring peaks',
      'Combines with Kalhatti Falls on the return'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['10:30 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Summit & Return', items: ['6 AM reach the base village, breakfast', 'Trek begins 7:30 AM up the open rock face', 'Devirammana temple darshan at the summit', 'Packed lunch with the Mullayanagiri panorama', 'After having lunch, descent starts', 'Kalhatti Falls stop', 'Depart 5 PM, reach Bangalore by midnight'] }
    ]
  },
  {
    id: 'kyatanamakki',
    name: 'Kyatanamakki Hill Trek',
    region: 'Kalasa · Chikmagalur',
    image: IMG.sunrise,
    duration: '1 Day',
    difficulty: 'Easy',
    altitude: '1,400 m',
    distance: '5 km',
    bestSeason: 'Sept–Feb',
    fromBangalore: '300 km',
    tag: "Sea of clouds at sunrise — Chikmagalur's wildest viewpoint.",
    highlights: [
      '360° sunrise over a sea of clouds',
      'Off-road jeep climb up the final stretch',
      'Unbroken Western Ghats panorama toward Kudremukh',
      'One of the least crowded viewpoints in Chikmagalur',
      'Horanadu Annapoorneshwari temple stop nearby'
    ],
    itinerary: [
      { day: 'Friday Night', title: 'Departure', items: ['10 PM pickup from Bangalore'] },
      { day: 'Saturday', title: 'Sunrise & Return', items: ['4:30 AM reach the jeep point', 'Off-road jeep + short trek to the summit', 'Sunrise above the cloud line', 'Breakfast at a Kalasa homestay', 'Horanadu temple visit', 'Lunch at Kalasa', 'After having lunch, return drive begins', 'Reach Bangalore by 11 PM'] }
    ]
  },
  {
    id: 'chikmagalur-backpacking',
    name: 'Chikmagalur Backpacking',
    region: 'Chikmagalur · Karnataka',
    image: IMG.misty,
    duration: '3 Days',
    difficulty: 'Easy',
    altitude: '1,200 m',
    distance: 'Flexible',
    bestSeason: 'Year-round',
    fromBangalore: '245 km',
    tag: 'Coffee estates, two peaks, slow weekend.',
    highlights: [
      'Mullayanagiri + Baba Budangiri — Karnataka\'s top two peaks',
      'Coffee estate homestay with plantation safari',
      'Hebbe Falls + Manikyadhara Falls',
      'Hirekolale Lake + Z-Point sunset',
      'Roasting demos + estate coffee tastings'
    ],
    itinerary: [
      { day: 'Day 0 · Thursday', title: 'Departure', items: ['10 PM pickup from Bangalore'] },
      { day: 'Day 1 · Friday', title: 'Coffee Country', items: ['6 AM reach Chikmagalur', 'Breakfast + coffee estate homestay check-in', 'Coffee plantation walk + roasting tour', 'Lunch at the estate', 'Evening at Hirekolale Lake'] },
      { day: 'Day 2 · Saturday', title: 'Peaks Day', items: ['Sunrise drive to Mullayanagiri', 'Mullayanagiri summit walk', 'Breakfast at homestay', 'Baba Budangiri ridge drive', 'Manikyadhara / Hebbe Falls visit', 'Bonfire + acoustic night at homestay'] },
      { day: 'Day 3 · Sunday', title: 'Return', items: ['Slow breakfast at the estate', 'Z-Point sunset / final coffee walk', 'Local market + coffee shopping', 'Depart 1 PM', 'Reach Bangalore by 8 PM'] }
    ]
  },
  {
    id: 'coorg',
    name: 'Coorg Adventure Trek',
    region: 'Madikeri · Karnataka',
    image: IMG.stream,
    duration: '3 Days',
    difficulty: 'Easy',
    altitude: '1,400 m',
    distance: 'Flexible',
    bestSeason: 'Oct–May',
    fromBangalore: '240 km',
    tag: 'Coffee, rafting, ridgeline.',
    highlights: [
      'River rafting at Dubare (Cauvery river)',
      'Dubare Elephant Camp interaction',
      'Tadiandamol summit or Brahmagiri walk',
      'Abbey Falls + Raja\'s Seat + Mandalpatti sunrise',
      'Tibetan Golden Temple (Namdroling) optional'
    ],
    itinerary: [
      { day: 'Day 0 · Thursday', title: 'Departure', items: ['10 PM pickup from Bangalore'] },
      { day: 'Day 1 · Friday', title: 'Madikeri', items: ['6 AM reach Madikeri', 'Breakfast + plantation homestay check-in', 'Omkareshwar Temple → Abbey Falls', 'Raja\'s Seat sunset', 'Coorg cuisine dinner'] },
      { day: 'Day 2 · Saturday', title: 'Adventure Day', items: ['Sunrise at Mandalpatti viewpoint', 'Tadiandamol half-trek or Brahmagiri walk', 'Lunch at the estate', 'Barapole / Dubare river rafting', 'Bonfire night'] },
      { day: 'Day 3 · Sunday', title: 'Wildlife + Return', items: ['Dubare Elephant Camp', 'Optional Tibetan Golden Temple visit', 'Lunch on the Kaveri river', 'Depart 3 PM, reach Bangalore by 10 PM'] }
    ]
  },
  {
    id: 'wayanad',
    name: 'Wayanad Expedition',
    region: 'Wayanad · Kerala',
    image: IMG.green,
    duration: '3 Days',
    difficulty: 'Moderate',
    altitude: '2,100 m',
    distance: 'Flexible',
    bestSeason: 'Sept–May',
    fromBangalore: '290 km',
    tag: 'Chembra Peak. Edakkal Caves. Tea country.',
    highlights: [
      'Heart-Shaped Lake on Chembra Peak (the signature attraction)',
      'Edakkal Caves — 6,000-year-old Neolithic petroglyphs',
      'Banasura Sagar Dam — largest earth dam in India',
      'Soochipara + Meenmutty Falls',
      'Thirunelli Temple + Kuruva Island'
    ],
    itinerary: [
      { day: 'Day 0 · Thursday', title: 'Departure', items: ['9 PM overnight bus from Bangalore'] },
      { day: 'Day 1 · Friday', title: 'Chembra Peak', items: ['7 AM reach Kalpetta', 'Breakfast + tea estate homestay check-in', 'Chembra Peak trek to the Heart-Shaped Lake (~1.5 hr)', 'After lunch, descent + estate tea tasting', 'Evening at Pookode Lake'] },
      { day: 'Day 2 · Saturday', title: 'Caves & Forest', items: ['Edakkal Caves morning visit', 'Lunch in Sulthan Bathery', 'Banasura Sagar Dam', 'Soochipara Falls', 'Bonfire + Kerala dinner'] },
      { day: 'Day 3 · Sunday', title: 'Return', items: ['Tea estate walk', 'Brunch', 'Optional Thirunelli temple stop', 'Depart 1 PM, reach Bangalore by 10 PM'] }
    ]
  },
  {
    id: 'manali',
    name: 'Manali Adventure Expedition',
    region: 'Kullu–Manali · Himachal Pradesh',
    image: IMG.sky,
    duration: '6 Days',
    difficulty: 'Easy-Moderate',
    altitude: '4,000 m',
    distance: 'Multi-stop',
    bestSeason: 'May–Oct',
    fromBangalore: 'Fly to Delhi · Volvo to Manali',
    tag: 'Snow passes, Old Manali cafes, and the Atal Tunnel to Sissu.',
    highlights: [
      'Jogini Falls + Hampta valley day trek above Vashisht',
      'Solang Valley — paragliding, zorbing, ropeway adventure sports',
      'Atal Tunnel drive to Sissu in Lahaul — snow even in summer',
      'Hadimba Devi temple, Old Manali cafes, and the Mall Road evening',
      'Optional Kasol + Manikaran hot springs extension'
    ],
    itinerary: [
      { day: 'Day 0', title: 'Departure', items: ['Fly Bangalore → Delhi', 'Overnight Volvo from Delhi to Manali'] },
      { day: 'Day 1', title: 'Arrive Manali', items: ['Reach Manali by noon, check-in', 'Hadimba Devi temple + Van Vihar walk', 'Old Manali cafes + Mall Road evening'] },
      { day: 'Day 2', title: 'Jogini Falls Trek', items: ['Vashisht hot springs morning', 'Trek to Jogini Falls through apple orchards', 'Packed lunch at the falls', 'After having lunch, descent + riverside evening'] },
      { day: 'Day 3', title: 'Solang Valley', items: ['Full adventure day at Solang', 'Paragliding / ropeway / zorbing (on-site pricing)', 'Bonfire + music night at the stay'] },
      { day: 'Day 4', title: 'Atal Tunnel · Sissu', items: ['Drive through the 9-km Atal Tunnel', 'Sissu waterfall + Chandra river valley in Lahaul', 'Snow point stop', 'Return to Manali by evening'] },
      { day: 'Day 5', title: 'Return', items: ['Slow breakfast + local shopping', 'Afternoon Volvo to Delhi', 'Fly back to Bangalore next morning'] }
    ]
  }
];

// Priority treks — shown first everywhere (featured grid + View More list).
const PRIORITY_IDS = ['kudremukh', 'netravati', 'bandaje', 'kurinjal', 'gangadikal', 'kodachadri'];
const FEATURED_IDS = PRIORITY_IDS;

const priorityRank = (id) => {
  const i = PRIORITY_IDS.indexOf(id);
  return i === -1 ? PRIORITY_IDS.length : i;
};

export default function FeaturedTreks() {
  const [active, setActive] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const { treks: liveTreks } = useLiveTreks(treks);

  const merged = liveTreks
    .map((t) => ({
      ...t,
      price: t.price ?? TREK_PRICES[t.id] ?? null
    }))
    .sort((a, b) => priorityRank(a.id) - priorityRank(b.id));

  const featured = FEATURED_IDS
    .map((id) => merged.find((t) => t.id === id))
    .filter(Boolean);

  useEffect(() => {
    const open = !!active || showAll;
    lockBackgroundScroll(open);
    return () => lockBackgroundScroll(false);
  }, [active, showAll]);

  const handleOpen = (trek, cardEl) => {
    smoothScrollTo(cardEl, -120);
    window.setTimeout(() => setActive(trek), 380);
  };

  const handleClose = () => setActive(null);

  const openFromList = (trek) => {
    setShowAll(false);
    window.setTimeout(() => setActive(trek), 250);
  };

  return (
    <section id="treks" className="bg-cream text-ink py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
          className="mb-14 lg:mb-20 text-center"
        >
          <span className="eyebrow text-muted tracking-[0.3em]">— Featured Treks —</span>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featured.map((t, i) => (
            <TrekCard key={t.id} trek={t} index={i} onOpen={handleOpen} />
          ))}
        </div>

        <div className="mt-14 lg:mt-20 flex justify-center">
          <button onClick={() => setShowAll(true)} className="btn-pill border-ink text-ink">
            View More Trips <span className="arrow">→</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {active && <TrekModal trek={active} onClose={handleClose} />}
        {showAll && <AllTreksModal treks={merged} onClose={() => setShowAll(false)} onSelect={openFromList} />}
      </AnimatePresence>
    </section>
  );
}

const TREK_FILTERS = [
  { id: 'all',       label: 'All',         match: () => true },
  { id: 'easy',      label: 'Easy',        match: (t) => /easy/i.test(t.difficulty || '') },
  { id: 'moderate',  label: 'Moderate',    match: (t) => /moderate/i.test(t.difficulty || '') && !/hard|tough|diffi/i.test(t.difficulty || '') },
  { id: 'tough',     label: 'Tough',       match: (t) => /tough|hard|diffi/i.test(t.difficulty || '') },
  { id: 'sunrise',   label: 'Sunrise',     match: (t) => /sunrise|night/i.test(`${t.name} ${t.tag || ''}`) },
  { id: 'waterfall', label: 'Waterfalls',  match: (t) => /falls|waterfall|cascade/i.test(`${t.name} ${t.tag || ''}`) },
  { id: 'beach',     label: 'Beach',       match: (t) => /beach|coast|gokarna/i.test(`${t.name} ${t.tag || ''}`) },
  { id: 'multi',     label: 'Multi-Day',   match: (t) => /3 Days|4 Days|5 Days|6 Days|7 Days|10 Days|expedition/i.test(`${t.duration || ''} ${t.name}`) }
];

function AllTreksModal({ treks, onClose, onSelect }) {
  const [filter, setFilter] = useState('all');
  const activeFilter = TREK_FILTERS.find((f) => f.id === filter) || TREK_FILTERS[0];
  const filtered = treks.filter(activeFilter.match);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[110] flex flex-col bg-base/95 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="All trips"
    >
      <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 bg-base/70 backdrop-blur border-b border-cream/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow text-ember">All Expeditions</div>
            <div className="serif text-2xl text-cream mt-1">{filtered.length} of {treks.length} trails</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close all trips"
            className="h-11 w-11 rounded-full bg-cream/10 text-cream hover:bg-ember grid place-items-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TREK_FILTERS.map((f) => {
            const isActive = filter === f.id;
            const count = treks.filter(f.match).length;
            if (count === 0 && f.id !== 'all') return null;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
                  isActive
                    ? 'bg-ember text-cream border-ember shadow-[0_0_20px_rgba(210,119,46,0.4)]'
                    : 'bg-cream/[0.05] text-cream/75 border-cream/15 hover:border-cream/40 hover:bg-cream/10'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] tracking-widest ${isActive ? 'text-cream/75' : 'text-cream/40'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div
        data-lenis-prevent
        className="flex-1 overflow-y-auto modal-scroll modal-scroll-dark px-6 lg:px-10 py-10"
      >
        {filtered.length === 0 ? (
          <div className="max-w-md mx-auto text-center text-cream/55 py-20">
            <div className="serif text-2xl text-cream mb-2">Nothing matches</div>
            <p className="text-sm">Try a different filter — every trail is a click away.</p>
          </div>
        ) : (
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
          {filtered.map((t, i) => (
            <motion.button
              key={t.id}
              onClick={() => onSelect(t)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1], delay: (i % 4) * 0.04 + 0.05 }}
              whileHover={{ y: -4 }}
              className="group text-left rounded-2xl overflow-hidden bg-cream/[0.04] border border-cream/10 hover:border-ember/40 transition-colors duration-500 focus:outline-none"
            >
              <div className="image-hover relative aspect-[5/4] overflow-hidden">
                <DriveImage src={t.image} alt={t.name} className="absolute inset-0 w-full h-full object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-base/90 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-cream/15 text-cream/90 backdrop-blur">
                    {t.duration}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.15em] bg-cream/15 text-cream/90 backdrop-blur">
                    {t.difficulty}
                  </span>
                </div>
                {t.price != null && (
                  t.offerPrice != null && t.offerPrice < t.price ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-ember text-cream text-[11px] font-medium shadow-[0_0_18px_rgba(210,119,46,0.55)]">
                      <span>{formatINR(t.offerPrice)}</span>
                      <span className="line-through text-cream/60 text-[10px]">{formatINR(t.price)}</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-ember text-cream text-[11px] font-medium">
                      {formatINR(t.price)}
                    </div>
                  )
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="serif text-lg text-cream leading-tight">{t.name}</div>
                  <div className="eyebrow text-cream/70 mt-1">{t.region}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        )}
      </div>
    </motion.div>
  );
}

function TrekCard({ trek, index, onOpen }) {
  const ref = useRef(null);
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1], delay: (index % 3) * 0.08 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col rounded-2xl bg-white/60 backdrop-blur border border-ink/5 overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_-20px_rgba(20,25,26,0.25)] transition-shadow duration-500"
    >
      <div className="image-hover relative aspect-[5/4] overflow-hidden">
        <DriveImage src={trek.image} alt={trek.name} className="absolute inset-0 w-full h-full object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <Pill>{trek.duration}</Pill>
          <Pill>{trek.difficulty}</Pill>
        </div>
        <div className="absolute top-4 right-4">
          <Pill tone="ember">{trek.bestSeason}</Pill>
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-cream">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="eyebrow text-cream/80 flex items-center gap-2">
                <MapPin size={12} /> {trek.region}
              </div>
              <h3 className="serif text-2xl lg:text-3xl tracking-tight mt-1 font-medium leading-tight">{trek.name}</h3>
            </div>
            {trek.price != null && (
              <div className="text-right shrink-0">
                <div className="eyebrow text-cream/70">From</div>
                {trek.offerPrice != null && trek.offerPrice < trek.price ? (
                  <>
                    <div className="serif text-2xl text-cream font-medium leading-none mt-1">{formatINR(trek.offerPrice)}</div>
                    <div className="text-xs text-cream/55 line-through mt-1">{formatINR(trek.price)}</div>
                  </>
                ) : (
                  <div className="serif text-2xl text-cream font-medium leading-none mt-1">{formatINR(trek.price)}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 lg:p-6">
        <p className="text-ink/75 text-[15px] leading-relaxed">{trek.tag}</p>

        <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
          <Meta icon={Clock} label="Duration" value={trek.duration} />
          <Meta icon={Mountain} label="Altitude" value={trek.altitude} />
          <Meta icon={Navigation} label="From BLR" value={trek.fromBangalore} />
        </div>

        <div className="mt-auto pt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpen(trek, ref.current)}
            className="inline-flex items-center gap-2 text-sm font-medium link-underline"
          >
            Read More <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
          <button
            type="button"
            onClick={() => onOpen(trek, ref.current)}
            aria-label={`Review itinerary then book ${trek.name}`}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-xs font-medium hover:bg-ember transition-colors"
          >
            Book →
          </button>
        </div>
      </div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-ember/0 group-hover:ring-ember/40 transition"
      />
    </motion.article>
  );
}

function Pill({ children, tone = 'default' }) {
  const classes =
    tone === 'ember'
      ? 'bg-ember text-cream'
      : 'bg-white/90 text-ink/85';
  return (
    <span className={`${classes} px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] backdrop-blur font-medium`}>
      {children}
    </span>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-muted">
        <Icon size={12} strokeWidth={1.6} />
        <span className="eyebrow text-[10px]">{label}</span>
      </div>
      <div className="mt-1 text-ink font-medium text-[13px]">{value}</div>
    </div>
  );
}

function TrekModal({ trek, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex items-stretch justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${trek.name} itinerary`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-base/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
        className="relative z-10 w-full lg:my-10 lg:mx-6 lg:max-w-5xl bg-cream text-ink rounded-none lg:rounded-3xl overflow-hidden flex flex-col max-h-[100vh] lg:max-h-[90vh]"
      >
        <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden group/slideshow">
          {(() => {
            const heroImages = Array.isArray(trek.gallery) && trek.gallery.filter(Boolean).length > 0
              ? trek.gallery.filter(Boolean)
              : [trek.image].filter(Boolean);
            return heroImages.length > 1 ? (
              <TrekSlideshow images={heroImages} />
            ) : (
              <motion.img
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
                src={toDriveImageURL(trek.image)}
                alt={trek.name}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/ridge-peak.jpg'; }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            );
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/30 pointer-events-none" />

          <button
            onClick={onClose}
            aria-label="Close itinerary"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 text-ink hover:bg-ember hover:text-cream transition-colors grid place-items-center"
          >
            <X size={18} />
          </button>

          <div className="absolute bottom-5 left-5 right-5 text-cream">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="eyebrow text-cream/80 flex items-center gap-2"
            >
              <MapPin size={12} /> {trek.region}
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="serif text-3xl sm:text-4xl lg:text-5xl tracking-tight font-medium mt-1 leading-tight"
            >
              {trek.name}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-2 text-cream/85 max-w-xl"
            >
              {trek.tag}
            </motion.p>
          </div>
        </div>

        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto modal-scroll px-5 sm:px-8 lg:px-10 py-8 lg:py-10"
        >
          {trek.story && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
              className="mb-10 max-w-2xl space-y-5"
            >
              {trek.story.map((para, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.15, duration: 0.7 }}
                  className={`serif leading-relaxed tracking-tight ${
                    i === 0
                      ? 'text-2xl lg:text-[1.65rem] text-ink/95 font-medium'
                      : 'text-lg lg:text-[1.15rem] text-ink/75'
                  }`}
                >
                  {para}
                </motion.p>
              ))}
              <div className="h-px w-12 bg-ember/60 mt-8" />
            </motion.div>
          )}

          {trek.price != null && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 p-5 rounded-2xl bg-ember/10 border border-ember/20"
            >
              <div className="flex items-center gap-3">
                <Tag size={18} className="text-ember" />
                <div>
                  <div className="eyebrow text-ember">All-Inclusive Fee</div>
                  {trek.offerPrice != null && trek.offerPrice < trek.price ? (
                    <div className="mt-1 leading-none flex items-baseline gap-3 flex-wrap">
                      <span className="serif text-3xl lg:text-4xl text-ember">{formatINR(trek.offerPrice)}</span>
                      <span className="serif text-xl text-ink/40 line-through">{formatINR(trek.price)}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest bg-ember text-cream font-sans animate-pulse">
                        Save {Math.round((1 - trek.offerPrice / trek.price) * 100)}%
                      </span>
                      <span className="text-ink/50 text-base font-sans">/ person</span>
                    </div>
                  ) : (
                    <div className="serif text-3xl lg:text-4xl mt-1 leading-none">{formatINR(trek.price)} <span className="text-ink/50 text-base font-sans">/ person</span></div>
                  )}
                </div>
              </div>
              <div className="text-xs text-ink/60 max-w-xs">
                Transport · Stay · Meals · Permits · Trek lead · First-aid. No hidden charges.
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 pb-8 border-b border-ink/10">
            <Stat icon={Clock} label="Duration" value={trek.duration} />
            <Stat icon={TrendingUp} label="Difficulty" value={trek.difficulty} />
            <Stat icon={Mountain} label="Altitude" value={trek.altitude} />
            <Stat icon={MapPin} label="Trail" value={trek.distance} />
            <Stat icon={Sun} label="Best Season" value={trek.bestSeason} />
            <Stat icon={Navigation} label="From BLR" value={trek.fromBangalore} />
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <span className="eyebrow text-muted">Trek Highlights</span>
              <ul className="mt-5 space-y-3.5">
                {trek.highlights.map((h, i) => (
                  <motion.li
                    key={h}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.08, duration: 0.5 }}
                    className="flex gap-3 text-[15px]"
                  >
                    <span className="mt-1 h-5 w-5 rounded-full bg-ember/15 text-ember grid place-items-center flex-shrink-0">
                      <Check size={12} strokeWidth={2.4} />
                    </span>
                    <span className="text-ink/85">{h}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 p-5 rounded-2xl bg-ink/5 border border-ink/5">
                <div className="eyebrow text-muted">Includes</div>
                <p className="mt-2 text-sm text-ink/80 leading-relaxed">
                  Transport from Bangalore · Stay · Meals (veg + non-veg) · Forest permits · Trek lead · First-aid kit
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <span className="eyebrow text-muted flex items-center gap-2">
                <Calendar size={12} /> Itinerary
              </span>
              <ol className="mt-6 relative">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-ink/15" aria-hidden />
                {trek.itinerary.map((d, i) => (
                  <motion.li
                    key={d.day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
                    className="relative pl-8 pb-8 last:pb-0"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.55 + i * 0.12, duration: 0.4 }}
                      className="absolute left-0 top-1 h-4 w-4 rounded-full bg-ember ring-4 ring-cream"
                    />
                    <div className="eyebrow text-ember">{d.day}</div>
                    <div className="serif text-2xl mt-1 tracking-tight font-medium">{d.title}</div>
                    <ul className="mt-3 space-y-1.5 text-[14.5px] text-ink/80 leading-relaxed">
                      {d.items.map((it) => (
                        <li key={it} className="flex gap-2.5">
                          <span className="mt-2 h-1 w-1 rounded-full bg-ink/40 flex-shrink-0" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>

          {Array.isArray(trek.gallery) && trek.gallery.filter(Boolean).length > 1 && (
            <TrekGalleryStrip images={trek.gallery.filter(Boolean)} />
          )}
          {trek.included && <IncludedRow items={trek.included} />}
          {trek.pickupPoints && <PickupPoints points={trek.pickupPoints} />}
          {trek.thingsToCarry && <ThingsToCarry items={trek.thingsToCarry} />}
          {trek.knowBeforeYouGo && <KnowBefore items={trek.knowBeforeYouGo} />}
          {trek.faqs && <FaqList faqs={trek.faqs} />}
          {trek.policies && <Policies data={trek.policies} />}

          <NearbyExplore trekId={trek.id} />
          <TrekGuidelines />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-12 pt-8 border-t border-ink/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <div className="eyebrow text-muted">Ready when you are</div>
              <div className="serif text-2xl mt-1">Reserve your slot →</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openBooking({
                  id: trek.id,
                  name: trek.name,
                  price: (trek.offerPrice != null && trek.offerPrice < trek.price) ? trek.offerPrice : trek.price
                })}
                className="btn-pill btn-solid"
              >
                Book Now <span className="arrow">→</span>
              </button>
              <a
                href="tel:+919902704361"
                className="btn-pill border-ink text-ink"
              >
                Call Team
              </a>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} strokeWidth={1.6} />
        <span className="eyebrow">{label}</span>
      </div>
      <div className="mt-2 serif text-lg lg:text-xl text-ink leading-tight">{value}</div>
    </div>
  );
}

function TrekGalleryStrip({ images }) {
  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted">From the Trail</span>
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {images.slice(0, 5).map((src, i) => (
          <motion.figure
            key={src + i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
            className="image-hover relative overflow-hidden rounded-xl aspect-[4/5] bg-ink/5"
          >
            <DriveImage
              src={src}
              alt=""
              width={800}
              sizes="(max-width: 640px) 50vw, 20vw"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function IncludedRow({ items }) {
  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted">What's Included</span>
      <ul className="mt-5 flex flex-wrap gap-2">
        {items.map((it) => (
          <li
            key={it}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-ember/10 border border-ember/25 text-ink text-sm"
          >
            <Check size={13} strokeWidth={2.4} className="text-ember" /> {it}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PickupPoints({ points }) {
  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted">Friday-Night Pickup Points</span>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {points.map((p) => (
          <div
            key={p.name + p.time}
            className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-mist/60 px-4 py-3"
          >
            <div className="h-9 w-9 rounded-full bg-ember/15 text-ember grid place-items-center flex-shrink-0">
              <MapPin size={15} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-ink">{p.name}</div>
              <div className="text-xs text-ink/65">{p.detail}</div>
            </div>
            <div className="text-xs font-medium text-ember whitespace-nowrap">{p.time}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink/55">
        Final confirmed pickup time is shared on WhatsApp 4–6 hours before departure.
      </p>
    </section>
  );
}

function ThingsToCarry({ items }) {
  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted">Things To Carry</span>
      <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-ink/[0.03] border border-ink/10 text-[13.5px] text-ink/85"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ember flex-shrink-0" /> {it}
          </li>
        ))}
      </ul>
    </section>
  );
}

function KnowBefore({ items }) {
  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none">
          <span className="eyebrow text-muted">Know Before You Go</span>
          <span className="text-xs text-ember group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <ul className="mt-5 space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[14.5px] text-ink/80 leading-relaxed">
              <span className="mt-2 h-1 w-1 rounded-full bg-ink/40 flex-shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function FaqList({ faqs }) {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted">Frequently Asked</span>
      <div className="mt-5 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={f.q}
              className={`rounded-2xl border transition-colors duration-300 ${
                isOpen ? 'border-ember/30 bg-ember/5' : 'border-ink/10 bg-mist/40 hover:border-ink/20'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="serif text-lg text-ink leading-snug">{f.q}</span>
                <span className={`text-ember text-xl flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
              </button>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pb-5 text-[14.5px] text-ink/80 leading-relaxed"
                >
                  {f.a}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Policies({ data }) {
  return (
    <section className="mt-12 pt-10 border-t border-ink/10">
      <span className="eyebrow text-muted">Booking Policies</span>
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PolicyCard title="Confirmation" items={data.confirmation} />
        <PolicyCard title="Cancellation" items={data.cancellation} tone="ember" />
      </div>
    </section>
  );
}

function PolicyCard({ title, items, tone }) {
  const accent = tone === 'ember' ? 'text-ember' : 'text-ink';
  return (
    <div className="rounded-2xl border border-ink/10 bg-mist/40 p-5 lg:p-6">
      <h4 className={`serif text-xl mb-4 ${accent}`}>{title} Policy</h4>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[13.5px] text-ink/80 leading-relaxed">
            <span className="mt-2 h-1 w-1 rounded-full bg-ink/40 flex-shrink-0" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
