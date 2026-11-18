import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

export default function TacticalWorkflow() {
  useEffect(() => {
    // Special: SVG Line Drawing
    const lineTween = gsap.to('#drawing-line', {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: "#how-it-works",
        start: "top center",
        end: "bottom center",
        scrub: 1
      }
    });

    return () => {
      lineTween.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === "#how-it-works") t.kill();
      });
    };
  }, []);

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-32 px-6 bg-ivory overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 id="how-it-works-heading" className="font-serif text-5xl text-ink mb-6">Onboard a client in 2 minutes</h2>
          <p className="text-ink/85 max-w-xl mx-auto">Our streamlined workflow is engineered for agency speed.</p>
        </motion.div>

        <div className="relative">
          {/* SVG Line Background */}
          <svg className="absolute top-1/2 left-0 w-full hidden lg:block -translate-y-1/2 overflow-visible pointer-events-none" 
               viewBox="0 0 1200 100" fill="none" preserveAspectRatio="none">
            <path 
              id="connecting-line"
              d="M 0 50 Q 300 0, 600 50 T 1200 50" 
              stroke="#B8975A" 
              strokeWidth="1.5"
              strokeDasharray="10 10"
              opacity="0.15"
            />
            <path 
              id="drawing-line"
              d="M 0 50 Q 300 0, 600 50 T 1200 50" 
              stroke="#B8975A" 
              strokeWidth="1.5"
              style={{ strokeDasharray: 1200, strokeDashoffset: 1200 }}
            />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {[
              { n: "01", t: "Connect Website", d: "Paste a URL and let Copygen crawl for voice, context, and data." },
              { n: "02", t: "Define Tone", d: "Select adjectives or provide sample copy to lock in the personality." },
              { n: "03", t: "Generate Memory", d: "Our AI compiles a persistent memory file for all future tasks." },
              { n: "04", t: "Start Scaling", d: "Create blogs, ads, and socials that actually sound like them." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="font-serif text-6xl text-gold/15 mb-6 leading-none">{step.n}</div>
                <h3 className="font-bold text-ink mb-3 text-lg">{step.t}</h3>
                <p className="text-ink/70 text-sm leading-relaxed">{step.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
