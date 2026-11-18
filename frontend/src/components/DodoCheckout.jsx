import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Crown, 
  Zap, 
  Rocket, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkoutAPI } from '../utils/api';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    monthlyPrice: 99,
    annualPrice: 1069,
    monthlyLaunchPrice: 69, // 30% off $99 is $69.3 -> $69
    annualLaunchPrice: null,
    generations: '300 generations',
    clients: '10 clients',
    features: [
      '300 content generations/mo',
      'All content types',
      'Brand memory for 10 clients',
      'Email support'
    ],
    icon: Rocket,
    color: 'var(--color-blue-500)',
    popular: false
  },
  {
    key: 'growth',
    name: 'Growth',
    monthlyPrice: 199,
    annualPrice: 2149,
    monthlyLaunchPrice: 139, // 30% off $199 is $139.3 -> $139
    annualLaunchPrice: null,
    generations: '1000 generations',
    clients: '30 clients',
    features: [
      '1000 content generations/mo',
      'All content types',
      'Brand memory for 30 clients',
      'Priority support',
      'White-label ready'
    ],
    icon: Zap,
    color: 'var(--color-purple-500)',
    popular: false
  },
  {
    key: 'agency',
    name: 'Agency',
    monthlyPrice: 399,
    annualPrice: 4309,
    monthlyLaunchPrice: 279, // 30% off $399 is $279.3 -> $279
    annualLaunchPrice: null,
    generations: '3000 generations',
    clients: '100 clients',
    features: [
      '3000 content generations/mo*',
      'All content types',
      'Brand memory for 100 clients',
      'Full white-label',
      'Dedicated support'
    ],
    footnote: '*Subject to Fair Use Policy (3,000/mo)',
    icon: Crown,
    color: 'var(--color-gold)',
    popular: true
  }
];

const DodoCheckout = ({ initialPlanKey = null, initialBillingCycle = 'monthly' }) => {
  const { user, setUser } = useAuth();
  const [isAnnual, setIsAnnual] = useState(initialBillingCycle === 'yearly');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [showActiveSubModal, setShowActiveSubModal] = useState(false);
  // Prevent double auto-trigger on re-renders
  const autoTriggered = useRef(false);

  const formatPeriodEnd = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const periodEndDate = user?.currentPeriodEnd ? formatPeriodEnd(user.currentPeriodEnd) : '';

  // 1. Handle URL success parameter and initial polling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setIsPolling(true);
      setStatusMessage('Activating your premium plan...');
      
      // Cleanup URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // 2. If a plan was pre-selected (from Settings Upgrade button), auto-trigger immediately
  useEffect(() => {
    if (initialPlanKey && !autoTriggered.current) {
      autoTriggered.current = true;
      handleSubscribe(initialPlanKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanKey]);

  // 2. Polling Logic
  useEffect(() => {
    if (!isPolling) return;

    let attempts = 0;
    const maxAttempts = 15; // 45 seconds total

    const pollStatus = async () => {
      try {
        const response = await checkoutAPI.dodo.status();
        const { plan } = response;

        // If plan is no longer free, it's activated
        if (plan !== 'free') {
          setStatusMessage('Success! Plan activated.');
          // Sync user object locally
          setUser(prev => ({ ...prev, plan }));
          
          setTimeout(() => {
            setIsPolling(false);
            window.location.href = '/app/generate';
          }, 2000);
          return true; // Stop polling
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
      return false;
    };

    const intervalId = setInterval(async () => {
      attempts++;
      const done = await pollStatus();
      
      if (done || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (!done) {
          setError('Activation taking longer than expected. Please check back in a few minutes.');
          setIsPolling(false);
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isPolling, setUser]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubscribe = async (planKey) => {
    setLoadingPlan(planKey);
    setError(null);
    try {
      const response = await checkoutAPI.dodo.subscribe({ planKey, isAnnual });
      if (response.paymentLink) {
        // Redirect to Dodo checkout
        window.location.href = response.paymentLink;
      }
    } catch (err) {
      if (err.status === 409 && (err.data?.error === 'ACTIVE_SUBSCRIPTION' || err.message === 'ACTIVE_SUBSCRIPTION')) {
        setShowActiveSubModal(true);
      } else {
        setError(err.data?.error || err.data?.message || err.message || 'Failed to initialize checkout. Please try again.');
      }
      setLoadingPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    
    setStatusMessage('Cancelling subscription...');
    setIsPolling(true);
    try {
      await checkoutAPI.dodo.cancel();
      // Status route will eventually return 'free'
    } catch (err) {
      setError('Failed to cancel. Please contact support.');
      setIsPolling(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#050508] text-white selection:bg-gold/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex-grow"
          >
            <h1 className="text-4xl md:text-6xl font-display mb-4 tracking-tight leading-[1.1] bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              Upgrade Your <br />
              <span className="italic text-gold">Production.</span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl font-sans font-medium">
              Select the engine that fits your ambition. Scale your output seamlessly with Copygen's global intelligence.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="shrink-0 bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex items-center gap-5 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
          >
            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 shadow-[0_0_20px_rgba(184,151,90,0.1)]">
              <ShieldCheck className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-black mb-1">Authenticated Account</p>
              <div className="flex items-center gap-4">
                <span className="text-white font-bold text-lg capitalize">{user?.plan || 'Free'}</span>
                {user?.plan !== 'free' && (
                  <button 
                    onClick={handleCancel}
                    className="text-red-400/60 hover:text-red-400 text-xs font-bold transition-colors underline underline-offset-4 decoration-red-400/20"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="relative flex bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 gap-1 backdrop-blur-2xl">
            <motion.div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-gold shadow-[0_0_30px_rgba(184,151,90,0.4)]"
              animate={{ left: !isAnnual ? '6px' : 'calc(50%)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                !isAnnual ? 'text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                isAnnual ? 'text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              Yearly
            </button>
          </div>
          
          <AnimatePresence>
            {isAnnual && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-gold font-sans font-bold text-sm"
              >
                <Check className="w-4 h-4" />
                <span>Annual Advantage: 10% Discount Auto-Applied</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {PLANS.map((plan, idx) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const launchPrice = isAnnual ? plan.annualLaunchPrice : plan.monthlyLaunchPrice;
            const intervalLabel = isAnnual ? '/yr' : '/mo';
            const saving = isAnnual ? Math.round(plan.monthlyPrice * 12 - plan.annualPrice) : null;
            const isFeatured = plan.popular;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`relative flex flex-col group p-1 rounded-[2.5rem] transition-all duration-500 ${
                  isFeatured ? 'bg-gradient-to-b from-gold/40 to-transparent shadow-[0_20px_80px_rgba(184,151,90,0.15)]' : 'bg-white/5'
                }`}
              >
                <div className="relative flex-grow bg-[#0c0c0f] rounded-[2.3rem] p-8 lg:p-10 flex flex-col overflow-hidden">
                  {/* Card Glow Effect */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                  
                  {/* Spotlight */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,0%),rgba(184,151,90,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {isFeatured && (
                    <div className="absolute top-8 right-8">
                      <span className="bg-gold text-black text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-[0_0_20px_rgba(184,151,90,0.4)]">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-8 group-hover:border-gold/30 transition-colors duration-500">
                      <plan.icon className={`w-8 h-8 ${isFeatured ? 'text-gold' : 'text-white/80'}`} strokeWidth={1.5} />
                    </div>
                    
                    <h3 className="text-3xl font-display text-white mb-2">{plan.name}</h3>
                    <p className="text-white/40 text-sm font-sans mb-8 leading-relaxed">Limit: {plan.generations}</p>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-sans font-bold tracking-tight text-white">
                        ${launchPrice ? launchPrice : price}
                      </span>
                      <span className="text-white/30 text-base font-sans font-medium uppercase tracking-widest">
                        {intervalLabel}
                      </span>
                    </div>

                    {launchPrice && (
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-gold/60 text-lg line-through font-sans decoration-gold/30">${price}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">Intro Offer</span>
                      </div>
                    )}

                    {isAnnual && saving && (
                      <div className="mt-4 p-3 rounded-xl bg-green-500/5 border border-green-500/10 inline-block">
                        <p className="text-xs text-green-400 font-bold uppercase tracking-wide">
                          Efficiency: Save ${saving}/year
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 mb-12 flex-grow font-sans">
                    <div className="pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3 text-white/80 font-bold">
                        <ShieldCheck className="w-5 h-5 text-gold" />
                        <span className="text-sm tracking-wide uppercase">{plan.clients}</span>
                      </div>
                    </div>
                    
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-4 group/item">
                        <div className="mt-1 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors duration-300">
                          <Check className="w-3 h-3 text-white/20 group-hover:text-gold transition-colors duration-300" />
                        </div>
                        <span className="text-white/50 text-[13px] font-medium leading-relaxed group-hover:text-white transition-colors duration-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 border-t border-white/5">
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={loadingPlan || user?.plan === plan.key || isPolling}
                      className={`w-full py-5 rounded-[1.25rem] font-bold text-sm tracking-[0.1em] uppercase transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                        user?.plan === plan.key
                          ? 'bg-white/5 text-white/20 cursor-not-allowed'
                          : isFeatured
                          ? 'bg-gold text-black hover:shadow-[0_10px_40px_rgba(184,151,90,0.3)] hover:-translate-y-1'
                          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {loadingPlan === plan.key ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : user?.plan === plan.key ? (
                        'Active Intelligence'
                      ) : (
                        <>
                          Subscribe
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    {plan.footnote && (
                      <p className="text-[10px] text-white/30 mt-6 italic text-center font-serif opacity-60">
                        {plan.footnote}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Global Security Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <div className="inline-flex flex-col md:flex-row items-center gap-8 px-12 py-8 rounded-[3rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl">
            <div className="text-left">
              <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mb-2 block">Global Processing Gateway</span>
              <div className="flex items-center gap-6">
                <span className="text-3xl font-display italic text-white/80">Dodo Payments</span>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-gold/40" />
                  <div className="text-left">
                    <p className="text-xs text-white/60 font-bold uppercase tracking-wider">International Secure</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">SSL Encrypted Pipeline</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Overlays / Toasts */}
      <AnimatePresence>
        {isPolling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111118] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center max-w-sm text-center relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(184,151,90,0.1),transparent_70%)] pointer-events-none" />
               <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-gold animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-gold/10 flex items-center justify-center">
                    <Rocket className="w-10 h-10 text-gold" />
                  </div>
               </div>
               <h2 className="text-3xl font-display mb-3">Syncing Status</h2>
               <p className="text-white/40 leading-relaxed font-sans">{statusMessage}</p>
            </motion.div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-red-500/10 border border-red-500/20 backdrop-blur-2xl text-red-400 px-8 py-5 rounded-3xl flex items-center gap-4 shadow-2xl shadow-red-500/10"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">{error}</span>
          </motion.div>
        )}

        {showActiveSubModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0c0c0f] border border-gold/20 p-8 md:p-10 rounded-[2.5rem] shadow-2xl flex flex-col max-w-2xl text-left relative overflow-hidden"
            >
              {/* Gold Top Light Decor */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(184,151,90,0.15),transparent_70%)] pointer-events-none" />
              
              <div className="relative z-10">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-display text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                  <span className="text-gold">★</span> You already have an active subscription
                </h2>
                
                {/* Content */}
                <div className="text-white/70 space-y-6 font-sans text-sm md:text-base leading-relaxed mb-8">
                  <p className="font-bold text-white/90">
                    You're currently on an active plan. To switch plans or resubscribe, you need to:
                  </p>
                  
                  <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                    <div className="flex gap-3">
                      <span className="text-gold font-bold">1.</span>
                      <p>
                        <span className="font-bold text-white/90">Cancel your current subscription</span> — Go to Settings → Billing → Cancel Subscription. This stops the auto-renewal but keeps your access active until the end of your current billing period.
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="text-gold font-bold">2.</span>
                      <p>
                        <span className="font-bold text-white/90">Wait for your current period to end</span> — You'll keep full access to all your plan features {periodEndDate ? `until ${periodEndDate}` : 'until the end of your billing cycle'}.
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="text-gold font-bold">3.</span>
                      <p>
                        <span className="font-bold text-white/90">Subscribe to your new plan</span> — Once your current period ends and your account downgrades to free, you can subscribe to any plan.
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-white/40 italic">
                    Need help? Contact us at <a href="mailto:support@copygen.in" className="text-gold/60 hover:text-gold hover:underline">support@copygen.in</a>
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 border-t border-white/10 pt-6">
                  <button
                    onClick={() => {
                      setShowActiveSubModal(false);
                      window.location.href = '/app/settings?tab=billing';
                    }}
                    className="flex-1 bg-gold text-black py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:shadow-[0_0_20px_rgba(184,151,90,0.3)] transition-all duration-300"
                  >
                    Go to Billing Settings
                  </button>
                  <button
                    onClick={() => setShowActiveSubModal(false)}
                    className="px-6 py-4 border border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors duration-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DodoCheckout;



