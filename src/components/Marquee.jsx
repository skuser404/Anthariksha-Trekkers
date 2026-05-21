const treks = ['KUDREMUKH', 'NETRAVATI', 'BANDAJE', 'KUMARA PARVATHA', 'TADIANDAMOL', 'ETTINA BHUJA'];

export default function Marquee() {
  const loop = [...treks, ...treks, ...treks];
  return (
    <section className="bg-cream text-ink py-7 overflow-hidden border-y border-ink/5">
      <div className="flex whitespace-nowrap animate-marquee">
        {loop.concat(loop).map((t, i) => (
          <span key={i} className="serif text-3xl md:text-5xl lg:text-6xl px-6 lg:px-10 flex items-center gap-10 lg:gap-14">
            {t}
            <span className="text-ember">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
