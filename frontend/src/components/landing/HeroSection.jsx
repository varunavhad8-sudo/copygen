import { motion } from 'framer-motion';
import ThreeBackground from './ThreeBackground';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 bg-ivory overflow-hidden">
      <ThreeBackground />
      
      <div className="relative z-10 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-6"
        >
          The Agency OS for 2026
        </motion.div>
        
        <motion.h1 
          id="hero-heading" 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-ink leading-[1.05] tracking-tight mb-8"
        >
          CopyGen — The AI Copy Generator <br />
          <span className="italic">That Knows Your Brand</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-ink/70 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Trained on your client's data. Guided by your agency's strategy. <br className="hidden md:block" />
          The only AI tool built specifically for high-volume creative teams.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
            onClick={() => navigate(user ? '/app' : '/signup')} 
            className="px-8 py-4 bg-gold text-ink font-bold rounded-xl hover:bg-gold/90 transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {user ? 'Go to Dashboard' : 'Start Free Trial'} <ChevronRight size={18} />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-ink border border-ink/10 rounded-xl font-bold text-sm hover:bg-ink/5 transition-all">
            Book a Demo
          </button>
        </motion.div>
      </div>

      {/* Subtle Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/40">Scroll to Explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-gold/40 to-transparent" />
      </motion.div>
    </section>
  );
}
