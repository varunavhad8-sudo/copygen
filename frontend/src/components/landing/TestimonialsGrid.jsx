import { motion } from 'framer-motion';

export default function TestimonialsGrid() {
  const testimonials = [
    { q: "Finally, an AI that doesn't make my clients sound like a robot. Copygen is the secret weapon of our agency.", a: "Sarah Jensen", c: "Creative Ops @ NeoMedia" },
    { q: "We've increased our blog output by 400% without hiring a single new writer. The Brand Memory tool is a game changer.", a: "Marcus Thorne", c: "Founder, ScaleAgency" },
    { q: "The level of control over tone and prohibited words makes this the only AI I trust with our enterprise clients.", a: "Elena Rodriguez", c: "Director of Content @ GlobalWise" }
  ];

  return (
    <section aria-labelledby="testimonials-grid-heading" className="py-32 px-6 bg-ink border-t border-white/5 overflow-hidden">
      <h2 id="testimonials-grid-heading" className="sr-only">Client Testimonials Grid</h2>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-ivory">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative"
            >
              <div className="text-gold mb-6 opacity-30 italic font-serif text-4xl">"</div>
              <p className="font-serif text-[20px] leading-relaxed mb-8 italic opacity-80">{t.q}</p>
              <div>
                <div className="font-bold text-sm tracking-tight">{t.a}</div>
                <div className="text-[10px] text-ivory/40 uppercase font-black tracking-widest mt-1">{t.c}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
