import { motion } from 'framer-motion';
import { CheckCircle, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BrandMemorySection() {
  const [videoExists, setVideoExists] = useState(false);

  useEffect(() => {
    fetch('/videos/brand-memory.mp4', { method: 'HEAD' })
      .then(res => {
        if (res.ok) setVideoExists(true);
      })
      .catch(() => setVideoExists(false));
  }, []);

  return (
    <section id="brand-memory" aria-labelledby="brand-memory-heading" className="py-32 px-6 bg-white overflow-hidden border-b border-border/50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-10 gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-4"
        >
          <span className="text-gold font-bold text-[10px] uppercase tracking-widest mb-4 block">01 — The Foundation</span>
          <h2 id="brand-memory-heading" className="font-serif text-5xl text-ink leading-[1.1] mb-8">
            AI with a <br /><span className="italic">perfect memory</span>
          </h2>
          <p className="text-ink/80 leading-relaxed mb-10">
            Stop fighting with generic AI outputs. Copygen studies your client's website, industry, and previous content to create a persistent "Brand Memory."
          </p>
          <div className="space-y-4">
            {[
              "Automatic tone extraction",
              "Power words & prohibited lists",
              "Context-aware generation"
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-ink text-sm font-bold">
                <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <CheckCircle size={12} />
                </div>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-6 relative perspective-video" 
          style={{ perspective: '1200px' }}
        >
          <div className="video-tilt-wrapper bg-ink rounded-3xl overflow-hidden shadow-3xl border border-border/50 relative group">
            <div className="aspect-video flex items-center justify-center bg-gold-light/20 overflow-hidden relative">
              {videoExists ? (
                <video 
                  src="/videos/brand-memory.mp4" 
                  autoPlay 
                  muted 
                  loop 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a] border border-[#c9a84c] rounded-xl flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                    <Play fill="currentColor" size={48} className="ml-2" />
                  </div>
                  <span className="text-ivory/40 text-[10px] font-black uppercase tracking-widest">Brand Memory Demo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-ink/10 pointer-events-none" />
              <span className="absolute bottom-6 right-6 text-[10px] font-black text-ivory uppercase tracking-widest bg-ink/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                Brand Intelligence Vector
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-gold via-gold-light to-gold" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
