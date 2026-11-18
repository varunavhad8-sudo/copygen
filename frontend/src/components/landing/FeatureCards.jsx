import { motion } from 'framer-motion';
import { Globe, Zap, Database, ArrowLeft, Play, Search, ChevronRight } from 'lucide-react';

export default function FeatureCards() {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-32 px-6 bg-white border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8"
        >
          <div className="max-w-xl text-left">
            <span className="text-gold font-bold text-[10px] uppercase tracking-widest mb-4 block">The Feature Set</span>
            <h2 id="features-heading" className="font-serif text-5xl text-ink leading-tight">Everything your creative team <br />is currently bogged down by</h2>
          </div>
          <button className="text-xs font-black uppercase tracking-widest text-gold hover:text-ink transition-colors flex items-center gap-2">
            View all features <ChevronRight size={14} />
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { i: <Globe size={22} />, t: "SEO Intelligence", d: "Content optimized for SERP with LSI keywords baked in automatically." },
            { i: <Zap size={22} />, t: "Instant Ad Sets", d: "Generate 20+ variations for Meta, LinkedIn, and Google in one click." },
            { i: <Database size={22} />, t: "Client Profiles", d: "Switch between 100+ clients with zero memory bleed or context loss." },
            { i: <ArrowLeft size={22} />, t: "Social Captions", d: "High-engagement captions tailored for Instagram, X, and LinkedIn." },
            { i: <Play size={22} />, t: "Video Scripts", d: "Hook-driven scripts for TikTok and YouTube that sound human." },
            { i: <Search size={22} />, t: "Search Briefs", d: "Give your writers (or AI) the ultimate blueprint for ranking #1." }
          ].map((f, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="premium-card p-10 rounded-2xl group flex flex-col h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-border/50 bg-ivory/20"
            >
              <div className="mb-8 text-gold group-hover:scale-110 transition-transform duration-300 transform-gpu">
                {f.i}
              </div>
              <h3 className="font-bold text-ink mb-4 text-xl tracking-tight">{f.t}</h3>
              <p className="text-ink/85 text-sm leading-relaxed mb-8 flex-grow">
                {f.d}
              </p>
              <div className="h-px bg-border w-12 group-hover:w-full transition-all duration-700 bg-gold" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
