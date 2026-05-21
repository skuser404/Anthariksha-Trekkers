import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(max-width: 1024px)').matches) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dot.current) {
        dot.current.style.left = mouseX + 'px';
        dot.current.style.top = mouseY + 'px';
      }
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ring.current) {
        ring.current.style.left = ringX + 'px';
        ring.current.style.top = ringY + 'px';
      }
      requestAnimationFrame(animate);
    };

    const onOver = (e) => {
      if (e.target.closest('a, button, [role="button"], input, textarea')) {
        ring.current?.classList.add('hover');
      } else {
        ring.current?.classList.remove('hover');
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className="cursor-ring" aria-hidden />
    </>
  );
}
