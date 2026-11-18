import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CTASection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="w-full bg-[#1a1a1a] py-32 px-6 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
      />
      
      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a84c] opacity-[0.07] blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="font-serif text-[40px] md:text-[56px] text-white font-bold leading-[1.1] mb-8"
        >
          Ready to ship copy that <br className="hidden md:block" />
          <span className="italic">actually converts?</span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-[#94a3b8] text-[18px] md:text-[20px] mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Join agencies saving 10+ hours a week with CopyGen. <br className="hidden md:block" />
          Start free, no credit card needed.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(user ? '/app' : '/signup')}
            className="px-8 py-4 bg-[#c9a84c] text-[#1a1a1a] rounded-md font-bold text-[15px] w-full sm:w-auto shadow-xl shadow-gold/10"
          >
            {user ? 'Go to Dashboard →' : 'Start Free Trial →'}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open('https://calendly.com', '_blank')}
            className="px-8 py-4 border border-white text-white rounded-md font-bold text-[15px] w-full sm:w-auto hover:bg-white/5 transition-colors"
          >
            Book a Demo
          </motion.button>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-[#64748b] text-[13px] font-medium"
        >
          No credit card required · 7-day free trial · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
