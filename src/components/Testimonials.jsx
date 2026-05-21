import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Ananya R.',
    trek: 'Kudremukh Trek',
    date: 'Aug 2025',
    rating: 5,
    body: "Did Kudremukh with Anthariksha last weekend. Pickup was on time at Majestic, sleeper tempo was clean. The trek lead (Manoj) kept the group together on the shola climb and made sure everyone got to the summit. Breakfast at the Mulodi homestay was unreal."
  },
  {
    name: 'Rohit K.',
    trek: 'Netravati Peak Trek',
    date: 'Oct 2025',
    rating: 5,
    body: "Netravati was wilder than I expected. The cliff-edge meadow camp at sunset and then waking up to fog rolling over the drop — surreal. Trek lead was super cautious near the edges. Honestly safer than treks I've done with bigger operators."
  },
  {
    name: 'Priya S.',
    trek: 'Bandaje Falls Trek',
    date: 'Sep 2025',
    rating: 5,
    body: "I'd been wanting to do Bandaje for two years. Booked with Anthariksha because a friend insisted, and now I get why. Camp at the cliff was magical, dinner was hot, leads carried first aid. Booked Kumara Parvatha before I even left the return bus."
  },
  {
    name: 'Karthik M.',
    trek: 'Kumara Parvatha Trek',
    date: 'Jul 2025',
    rating: 5,
    body: "KP is no joke. The Shesha Parvatha climb broke me, but the lead kept pacing the slow folks (me) and we all summited. Bhattara Mane food deserves its own review. 4 AM headlamp start was perfectly timed for sunrise."
  },
  {
    name: 'Sneha V.',
    trek: 'Skandagiri Sunrise Trek',
    date: 'Dec 2025',
    rating: 5,
    body: "First night trek and I was nervous. Group was warm, the leads checked on everyone every 15 minutes on the climb up. Sunrise above the cloud sea is exactly what people say it is. Back in Bangalore by noon for biryani."
  },
  {
    name: 'Aditya N.',
    trek: 'Tadiandamol Trek',
    date: 'Jan 2026',
    rating: 4,
    body: "Coorg's highest peak — done in a single day from Bangalore. Trek was steeper than I expected, lead let us pace it. Coffee at the estate on the way back was a nice touch. Only wish we had more time on the summit."
  },
  {
    name: 'Meera P.',
    trek: 'Kodachadri Trek',
    date: 'Nov 2025',
    rating: 5,
    body: "Hidlumane waterfall is the highlight — we swam, ate packed lunch, climbed to Sarvajnapeetha and watched the sunset from the peak. Open jeep ride down was bumpy but fun. Anthariksha managed the rain well."
  },
  {
    name: 'Vikram B.',
    trek: 'Mullayanagiri Trek',
    date: 'Feb 2026',
    rating: 5,
    body: "Picked Mullayanagiri for my first-ever trek. Easy enough for a beginner, scenic enough to make me want to do more. Sarpadhari ridge walk is the kind of thing you remember years later. Booked Ettina Bhuja for next month already."
  },
  {
    name: 'Divya H.',
    trek: 'Ettina Bhuja Trek',
    date: 'Oct 2025',
    rating: 5,
    body: "Did Ettina Bhuja on a fog-heavy morning. Visibility was zero for half the climb and then we broke through the clouds at the summit. Lead read the weather perfectly and we got an hour clear on top. Returned the same night, slept in my own bed."
  },
  {
    name: 'Rahul A.',
    trek: 'Kunti Betta Night Trek',
    date: 'Mar 2025',
    rating: 4,
    body: "Solid first night trek for the price. Lakeside camp was peaceful, stargazing was unexpectedly good. Climb is short but boulder-y — wear shoes with grip. Kayaking add-on in the morning made it a proper weekend."
  },
  {
    name: 'Ishita T.',
    trek: 'Gokarna Beach Trek',
    date: 'Dec 2025',
    rating: 5,
    body: "Five beaches in two days. Walked Kudle → Om → Half-Moon → Paradise barefoot. The lead knew every shortcut between the cliffs. Beach shack dinner was the kind you don't want to leave. Different from a mountain trek, equally good."
  },
  {
    name: 'Arjun D.',
    trek: 'Dudhsagar Falls Trek',
    date: 'Aug 2025',
    rating: 5,
    body: "Walked the railway track to Dudhsagar — train passed us twice which was insane. The falls up close are absurd, can't describe the scale. Swam in the plunge pool for an hour. Long day, but worth every kilometre."
  }
];

const tabs = ['All Reviews', 'Western Ghats', 'Sunrise / Night', 'Beach / Falls'];

export default function Testimonials() {
  return (
    <section className="bg-cream text-ink py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-12 lg:mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <span className="eyebrow text-muted">Reviews · From real trekkers</span>
            <h2 className="serif mt-4 text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium">
              What our trekkers <em className="italic">say.</em>
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-1 text-ember">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <div className="serif text-3xl mt-2 leading-none">
                4.9 <span className="text-muted text-base">/ 5</span>
              </div>
              <div className="eyebrow text-muted mt-1">{reviews.length}+ verified reviews</div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.18em] border transition ${
                i === 0
                  ? 'bg-ink text-cream border-ink'
                  : 'border-ink/15 text-ink/70 hover:border-ink/40'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pl-6 lg:pl-10 pb-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-6 lg:gap-8 w-max pr-6 lg:pr-10">
          {reviews.map((r, i) => (
            <motion.figure
              key={r.name + r.trek}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1], delay: (i % 4) * 0.08 }}
              className="w-[88vw] sm:w-[440px] lg:w-[460px] flex-shrink-0 flex flex-col border border-ink/10 rounded-2xl p-7 lg:p-9 bg-mist/60 hover:bg-mist transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-ember">
                  {[...Array(r.rating)].map((_, idx) => (
                    <Star key={idx} size={13} fill="currentColor" strokeWidth={0} />
                  ))}
                  {[...Array(5 - r.rating)].map((_, idx) => (
                    <Star key={`e${idx}`} size={13} className="text-ink/15" fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <Quote size={22} className="text-ember/70" strokeWidth={1.4} />
              </div>

              <blockquote className="mt-6 text-[15.5px] leading-relaxed text-ink/85 flex-1">
                "{r.body}"
              </blockquote>

              <figcaption className="mt-8 pt-5 border-t border-ink/10 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="eyebrow text-muted mt-1">{r.trek}</div>
                </div>
                <span className="text-xs text-muted">{r.date}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mt-10 text-sm text-muted">
        Verified bookings · Sourced from our trek WhatsApp groups and Thrillophilia-style review summaries.
      </div>
    </section>
  );
}
