import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PricingBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section id="pricing-banner" aria-labelledby="pricing-banner-heading" className="py-24 px-6 bg-gold-light text-ink overflow-hidden border-y border-gold/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-left"
        >
          <h2 id="pricing-banner-heading" className="font-serif text-6xl md:text-8xl flex items-baseline gap-2">
            <span className="text-xl md:text-4xl font-sans font-bold text-ink opacity-40 -mr-2">from</span>
            $<span id="price-counter">99</span>
            <span className="text-xl md:text-3xl font-sans font-bold text-gold opacity-60">/mo</span>
          </h2>
          <p className="font-bold text-gold mt-4 uppercase tracking-[0.2em] text-[11px]">No setup fees • Professional grade AI • Flexible scaling</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center md:items-end"
        >
          <button 
            onClick={() => navigate(user ? '/app' : '/signup')} 
            className="px-10 py-5 bg-ink text-ivory rounded-xl font-bold text-sm hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 mb-4"
          >
            {user ? 'Go to Dashboard' : 'Get Started Now'}
          </button>
          <p className="text-[10px] text-ink/60 font-bold tracking-widest uppercase">No credit card required • 7-day free trial</p>
        </motion.div>
      </div>
    </section>
  );
}
