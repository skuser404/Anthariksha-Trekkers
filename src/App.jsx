import { useEffect, useState } from 'react';
import Lenis from '@studio-freight/lenis';

import Cursor from './components/Cursor.jsx';
import AnnouncementBanner from './components/AnnouncementBanner.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import Intro from './components/Intro.jsx';
import FeaturedTreks from './components/FeaturedTreks.jsx';
import WhyUs from './components/WhyUs.jsx';
import ParallaxBreak from './components/ParallaxBreak.jsx';
import Gallery from './components/Gallery.jsx';
import ExploreAround from './components/ExploreAround.jsx';
import VideoStory from './components/VideoStory.jsx';
import Testimonials from './components/Testimonials.jsx';
import Batches from './components/Batches.jsx';
import CTABanner from './components/CTABanner.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppFloat from './components/WhatsAppFloat.jsx';
import BookingModal from './components/BookingModal.jsx';
import AdminRouter from './admin/AdminRouter.jsx';

const ADMIN_PATHS = ['/antariksha-control-panel', '/control-room'];

function useIsAdminRoute() {
  const matches = () =>
    typeof window !== 'undefined' &&
    ADMIN_PATHS.some((p) => window.location.pathname.startsWith(p));
  const [isAdmin, setIsAdmin] = useState(matches);
  useEffect(() => {
    const onPop = () => setIsAdmin(matches());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return isAdmin;
}

export default function App() {
  const isAdmin = useIsAdminRoute();

  // The custom cursor only exists on the public site — keep the native
  // cursor visible everywhere else (admin panel had an invisible cursor).
  useEffect(() => {
    document.body.classList.toggle('use-custom-cursor', !isAdmin);
    return () => document.body.classList.remove('use-custom-cursor');
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });
    window.__lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      delete window.__lenis;
    };
  }, [isAdmin]);

  if (isAdmin) return <AdminRouter />;

  return (
    <div className="relative bg-base text-cream">
      <Cursor />
      <AnnouncementBanner />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Intro />
        <VideoStory />
        <FeaturedTreks />
        <WhyUs />
        <ParallaxBreak />
        <Gallery />
        <ExploreAround />
        <Testimonials />
        <Batches />
        <CTABanner />
      </main>
      <Footer />
      <WhatsAppFloat />
      <BookingModal />
    </div>
  );
}
