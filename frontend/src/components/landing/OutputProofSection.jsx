import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function OutputProofSection() {
  const [videoExists, setVideoExists] = useState(false);

  useEffect(() => {
    fetch('/videos/output-proof.mp4', { method: 'HEAD' })
      .then(res => {
        if (res.ok) setVideoExists(true);
      })
      .catch(() => setVideoExists(false));
  }, []);

  return (
    <section aria-labelledby="proof-heading" className="py-40 px-6 bg-ink text-ivory overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="w-full h-full bg-[radial-gradient(#B8975A_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-gold font-bold text-[10px] uppercase tracking-widest mb-6 block">The Proof</span>
          <h2 id="proof-heading" className="font-serif text-5xl md:text-6xl mb-12">Content generated in seconds <br /><span className="italic text-gold">not hours</span></h2>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="premium-card bg-ivory/5 border border-white/10 rounded-3xl overflow-hidden aspect-video relative flex items-center justify-center group cursor-pointer"
        >
          {videoExists ? (
            <video 
              src="/videos/output-proof.mp4" 
              autoPlay 
              muted 
              loop 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#1a1a1a] border border-[#c9a84c] rounded-xl flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                <Play fill="currentColor" size={48} className="ml-2" />
              </div>
              <span className="text-ivory/40 text-[10px] font-black uppercase tracking-widest text-center">
                See CopyGen Generate in &lt;3 Seconds
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-ink/10 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="w-16 h-16 rounded-full bg-gold/80 flex items-center justify-center text-ink shadow-2xl">
                <Play fill="currentColor" size={24} className="ml-1" />
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
