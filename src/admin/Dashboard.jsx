import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Image as ImageIcon, Share2, Tag, Megaphone, FileText,
  Camera, ChevronLeft, LogOut, ClipboardList, Activity, ShieldAlert,
  Layers, Sparkles, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { ToastHost } from './editors/_shared.jsx';

import PriceEditor from './editors/PriceEditor.jsx';
import ItineraryEditor from './editors/ItineraryEditor.jsx';
import ImageManager from './editors/ImageManager.jsx';
import GalleryManager from './editors/GalleryManager.jsx';
import SocialLinksEditor from './editors/SocialLinksEditor.jsx';
import AnnouncementManager from './editors/AnnouncementManager.jsx';
import TermsEditor from './editors/TermsEditor.jsx';
import TrekGuidelinesEditor from './editors/TrekGuidelinesEditor.jsx';
import BookingsView from './editors/BookingsView.jsx';
import CategoryManager from './editors/CategoryManager.jsx';
import PlanningRequestsView from './editors/PlanningRequestsView.jsx';
import MessagesView from './editors/MessagesView.jsx';

const CARDS = [
  { id: 'itinerary',     icon: Calendar,      title: 'Itinerary Editor',        desc: 'Edit day-by-day plans + highlights per trek.',          accent: 'from-ember/30 to-ember/5' },
  { id: 'images',        icon: ImageIcon,     title: 'Trek Image Manager',      desc: 'Swap card / hero photos via Google Drive links.',       accent: 'from-amber-400/30 to-amber-400/5' },
  { id: 'social',        icon: Share2,        title: 'Social Media Links',      desc: 'Instagram · WhatsApp · phone · Google Business.',       accent: 'from-sky-400/30 to-sky-400/5' },
  { id: 'prices',        icon: Tag,           title: 'Trip Price Editor',       desc: 'Update per-trek pricing + open/closed status.',         accent: 'from-emerald-400/30 to-emerald-400/5' },
  { id: 'announcements', icon: Megaphone,     title: 'Announcements',           desc: 'Banner messages + monsoon notices + offers.',           accent: 'from-rose-400/30 to-rose-400/5' },
  { id: 'terms',         icon: FileText,      title: 'Terms & Conditions',      desc: 'Policies · Privacy · Cancellation · Safety.',           accent: 'from-indigo-400/30 to-indigo-400/5' },
  { id: 'gallery',       icon: Camera,        title: 'Gallery Manager',         desc: 'Reorder, add, or hide gallery photos (Drive links).',   accent: 'from-fuchsia-400/30 to-fuchsia-400/5' },
  { id: 'guidelines',    icon: ShieldAlert,   title: 'Trek Guidelines',         desc: "Global Do's, Don'ts, and the mandatory lunchbox rule.", accent: 'from-emerald-400/30 to-emerald-400/5' },
  { id: 'bookings',      icon: ClipboardList, title: 'Recent Bookings',         desc: 'Latest 50 enquiries from WhatsApp & form submits.',     accent: 'from-violet-400/30 to-violet-400/5' },
  { id: 'planning',      icon: Sparkles,      title: 'Planning Requests',       desc: 'Custom trip requests from the search & planner forms.', accent: 'from-ember/30 to-ember/5' },
  { id: 'categories',    icon: Layers,        title: 'Search Categories',       desc: 'Tabs in the homepage search widget — add or disable.',  accent: 'from-teal-400/30 to-teal-400/5' },
  { id: 'messages',      icon: Mail,          title: 'Contact Messages',        desc: 'Messages from the website contact form.',               accent: 'from-cyan-400/30 to-cyan-400/5' }
];

const VIEWS = {
  itinerary:     ItineraryEditor,
  images:        ImageManager,
  social:        SocialLinksEditor,
  prices:        PriceEditor,
  announcements: AnnouncementManager,
  terms:         TermsEditor,
  gallery:       GalleryManager,
  guidelines:    TrekGuidelinesEditor,
  bookings:      BookingsView,
  planning:      PlanningRequestsView,
  categories:    CategoryManager,
  messages:      MessagesView
};

export default function AdminDashboard({ user }) {
  const [section, setSection] = useState(null);
  const active = section ? CARDS.find((c) => c.id === section) : null;
  const ActiveView = section ? VIEWS[section] : null;

  // Reset scroll on section change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);

  return (
    <div className="min-h-screen bg-base text-cream">
      <ToastHost />
      <header className="sticky top-0 z-30 bg-base/85 backdrop-blur-xl border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {section ? (
              <button
                onClick={() => setSection(null)}
                className="h-9 w-9 rounded-full bg-cream/10 hover:bg-ember hover:text-cream grid place-items-center transition-colors flex-shrink-0"
                aria-label="Back to dashboard"
              >
                <ChevronLeft size={18} />
              </button>
            ) : (
              <img src="/images/logo.png" alt="Anthariksha" className="h-9 w-9 rounded-full ring-1 ring-cream/15" />
            )}
            <div className="min-w-0">
              <div className="eyebrow text-ember">Control Panel</div>
              <div className="serif text-base lg:text-lg truncate">
                {active ? active.title : 'Anthariksha Trekkers'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden sm:block text-xs text-cream/50">{user.email}</div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-cream/15 hover:border-ember hover:text-ember transition-colors"
              title="Sign out"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <AnimatePresence mode="wait">
          {!section && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
            >
              <div className="mb-10 lg:mb-14">
                <h1 className="serif text-4xl lg:text-5xl tracking-tight font-medium">
                  Welcome back, <em className="italic text-ember">{(user.email || 'admin').split('@')[0]}</em>.
                </h1>
                <p className="mt-4 text-cream/55 text-sm max-w-xl">
                  Everything you change here goes live on the site in real time. No deploys needed.
                </p>
              </div>

              <LiveStatsRow />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
                {CARDS.map((c, i) => (
                  <AdminCard key={c.id} card={c} index={i} onOpen={() => setSection(c.id)} />
                ))}
              </div>

              <p className="mt-14 text-xs text-cream/35">
                Phase 1 · Foundation · Realtime sync via Supabase · Drive-based media · RLS-protected writes
              </p>
            </motion.div>
          )}

          {section && ActiveView && (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
            >
              <ActiveView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function LiveStatsRow() {
  const [stats, setStats] = useState({
    treks: { count: null, active: null },
    bookings: { count: null, recent: null },
    gallery: null,
    announcements: null
  });

  async function load() {
    const [
      treksAll, treksLive,
      bookingsAll, bookingsToday,
      galleryActive,
      annActive
    ] = await Promise.all([
      supabase.from('treks').select('id', { count: 'exact', head: true }),
      supabase.from('treks').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('gallery_images').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('is_active', true)
    ]);
    setStats({
      treks: { count: treksAll.count, active: treksLive.count },
      bookings: { count: bookingsAll.count, recent: bookingsToday.count },
      gallery: galleryActive.count,
      announcements: annActive.count
    });
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('realtime:admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const items = [
    { label: 'Active Treks',       value: stats.treks.active, total: stats.treks.count, icon: Activity, tint: 'text-moss' },
    { label: 'Recent Bookings',    value: stats.bookings.recent, total: stats.bookings.count, icon: ClipboardList, tint: 'text-ember', subLabel: 'last 24h' },
    { label: 'Live Gallery Photos', value: stats.gallery, icon: Camera, tint: 'text-amber-300' },
    { label: 'Announcements Live', value: stats.announcements, icon: Megaphone, tint: 'text-rose-300' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 lg:mb-16">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-cream/10 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow text-cream/55">{it.label}</span>
              <Icon size={14} className={it.tint} />
            </div>
            <div className="mt-3 serif text-3xl text-cream leading-none">
              {it.value == null ? <span className="text-cream/30">—</span> : it.value}
              {it.total != null && <span className="ml-2 text-base text-cream/30">/ {it.total}</span>}
            </div>
            {it.subLabel && <div className="mt-1 text-[11px] text-cream/40">{it.subLabel}</div>}
          </motion.div>
        );
      })}
    </div>
  );
}

function AdminCard({ card, index, onOpen }) {
  const Icon = card.icon;
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.06, ease: [0.7, 0, 0.2, 1] }}
      whileHover={{ y: -4 }}
      className="group relative text-left rounded-2xl p-6 lg:p-7 bg-white/[0.03] backdrop-blur-sm border border-cream/10 hover:border-ember/40 transition-colors duration-500 overflow-hidden focus:outline-none focus:ring-2 focus:ring-ember/40"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} aria-hidden />
      <div className="relative">
        <div className="h-12 w-12 rounded-full bg-cream/10 text-ember grid place-items-center transition-transform duration-500 group-hover:scale-110 group-hover:bg-ember group-hover:text-cream">
          <Icon size={20} strokeWidth={1.6} />
        </div>
        <h3 className="serif text-2xl mt-6 tracking-tight font-medium leading-tight">{card.title}</h3>
        <p className="mt-3 text-sm text-cream/60 leading-relaxed">{card.desc}</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-ember opacity-70 group-hover:opacity-100 transition-opacity">
          Open <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(210,119,46,0)] group-hover:shadow-[inset_0_0_0_1px_rgba(210,119,46,0.25),0_30px_60px_-30px_rgba(210,119,46,0.4)] transition-shadow duration-700" />
    </motion.button>
  );
}
