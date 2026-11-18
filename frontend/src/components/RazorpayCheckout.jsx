import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Crown, 
  Rocket, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Gift
} from 'lucide-react';
import { checkoutAPI } from '../utils/api';

const PLANS = [];

PLANS.push(
  {
    key: 'starter',
    name: 'Starter',
    monthly:     { amount: '₹8,199',    raw: 8199   },
    yearly:      { amount: '₹88,549',   raw: 88549  },
    launchPrice: '₹5,699',
    description: 'Perfect for small business owners',
    clients: '30 brand voice clients',
    features: [
      '300 content generations/month',
      '10 client brand memories',
      'All content types',
      'Email support',
    ],
    icon: Rocket,
    color: '#3b82f6',
    badge: null,
  },
  {
    key: 'growth',
    name: 'Growth',
    monthly:     { amount: '₹16,399',   raw: 16399  },
    yearly:      { amount: '₹1,77,109', raw: 177109 },
    launchPrice: '₹11,399',
    description: 'Scaling for marketing agencies',
    clients: '150 brand voice clients',
    features: [
      '1000 content generations/month',
      '30 client brand memories',
      'All content types',
      'Priority support',
    ],
    icon: Zap,
    color: '#a855f7',
    badge: null,
  },
  {
    key: 'agency',
    name: 'Agency',
    monthly:     { amount: '₹32,799',    raw: 32799  },
    // yearly:      { amount: '₹3,54,229',  raw: 354229 }, // DISABLED per user request
    launchPrice: '₹22,799',
    description: 'Maximum power for large teams',
    clients: 'Unlimited brand voice clients',
    features: [
      '3000 content generations/month*',
      '100 client brand memories',
      'All content types',
      'Dedicated account manager',
    ],
    footnote: '*Subject to Fair Use Policy (3,000/mo)',
    icon: Crown,
    color: '#c9a84c',
    badge: 'Best Value',
  }
);

const RazorpayCheckout = ({ user, onPlanUpdate, initialPlanKey = null, initialBillingCycle = 'monthly' }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [errorPlan, setErrorPlan] = useState({ key: null, message: '' });
  const [billingCycle, setBillingCycle] = useState(initialBillingCycle);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showActiveSubModal, setShowActiveSubModal] = useState(false);
  // Track whether we've already auto-triggered so we don't double-fire
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

  // 1. Dynamically load Razorpay SDK
  useEffect(() => {
    if (window.Razorpay) { setScriptLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setErrorPlan({ key: 'global', message: 'Razorpay SDK failed to load. Check your internet.' });
    document.body.appendChild(script);
  }, []);

  // 2. If a plan was pre-selected (from Settings Upgrade button), auto-trigger on SDK load
  useEffect(() => {
    if (initialPlanKey && scriptLoaded && !autoTriggered.current) {
      autoTriggered.current = true;
      handleSubscribe(initialPlanKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanKey, scriptLoaded]);

  // Auto-clear errors
  useEffect(() => {
    if (errorPlan.message) {
      const timer = setTimeout(() => setErrorPlan({ key: null, message: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorPlan.message]);

  // Payment Verification
  const verifyPayment = async (response, planKey) => {
    try {
      console.log('[RazorpayCheckout] Verifying payment...', { planKey });
      const verifyRes = await checkoutAPI.razorpay.verify({
        razorpayPaymentId:      response.razorpay_payment_id,
        razorpaySubscriptionId: response.razorpay_subscription_id,
        razorpaySignature:      response.razorpay_signature,
        planKey,
      });
      if (verifyRes.success) {
        console.log('[RazorpayCheckout] ✅ Verification success, plan:', verifyRes.plan);
        // Refresh user context first, then redirect
        if (onPlanUpdate) await onPlanUpdate(planKey);
        // Small delay to let context propagate before redirect
        setTimeout(() => {
          window.location.href = '/app/settings?tab=billing&success=true';
        }, 800);
      }
    } catch (err) {
      console.error('[RazorpayCheckout] Verify error:', err);
      setErrorPlan({ key: planKey, message: err?.error || err?.message || 'Payment verification failed. Please contact support.' });
      setLoadingPlan(null);
    }
  };

  // Handle Subscription Initiation
  const handleSubscribe = async (planKey) => {
    if (!scriptLoaded) return;
    setLoadingPlan(planKey);
    setErrorPlan({ key: null, message: '' });

    try {
      const response = await checkoutAPI.razorpay.subscribe({ planKey, billingCycle });
      const { subscriptionId, razorpayKeyId } = response;

      const options = {
        key:             razorpayKeyId,
        subscription_id: subscriptionId,
        name:            'CopyGen',
        description:     'AI Marketing OS for Agencies',
        image:           'https://copygen.in/logo.png',
        
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        
        theme: {
          color: '#B8975A',
          backdrop_color: '#050508',
          hide_topbar: false
        },
        
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: () => {
            setLoadingPlan(null);
            setIsCheckoutOpen(false);
            document.body.style.backgroundColor = '';
            document.body.style.backdropFilter = '';
            console.log('Checkout closed');
          }
        },
        
        notes: {
          product: `CopyGen ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`,
          description: 'Unlimited AI content generation for agencies'
        },
        
        handler: (res) => {
          setIsCheckoutOpen(false);
          document.body.style.backgroundColor = '';
          document.body.style.backdropFilter = '';
          verifyPayment(res, planKey);
        },
      };

      document.body.style.backgroundColor = '#050508';
      document.body.style.backdropFilter = 'blur(10px)';
      setIsCheckoutOpen(true);

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      if (err.status === 409 && (err.data?.error === 'ACTIVE_SUBSCRIPTION' || err.message === 'ACTIVE_SUBSCRIPTION')) {
        setShowActiveSubModal(true);
      } else {
        setErrorPlan({ key: planKey, message: err.data?.error || err.data?.message || err.message || 'Failed to initialize subscription. Try again.' });
      }
      setLoadingPlan(null);
    }
  };

  const monthlyEquivalent = (plan) => {
    if (billingCycle === 'yearly' && plan.yearly) {
      const mo = Math.round(plan.yearly.raw / 12);
      const saved = Math.round(plan.monthly.raw * 12 - plan.yearly.raw);
      return { mo: `₹${mo.toLocaleString('en-IN')}/mo`, saved: `₹${saved.toLocaleString('en-IN')}` };
    }
    return null;
  };

  return (
    <div className="relative w-full min-h-screen bg-[#050508] text-white selection:bg-gold/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-8 backdrop-blur-xl">
            <TrendingUp className="w-4 h-4 text-gold" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80">India Exclusive Pricing</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-display mb-8 tracking-tight leading-[0.9] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
            Empower Your <br />
            <span className="italic text-gold">Growth Story.</span>
          </h1>
          
          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-sans font-medium">
            Select the professional framework designed to scale your content operations. 
            Transparent INR pricing for our Indian community.
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 gap-1 backdrop-blur-2xl">
              {/* Sliding highlight */}
              <motion.div
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-gold shadow-[0_0_30px_rgba(184,151,90,0.4)]"
                animate={{ left: billingCycle === 'monthly' ? '6px' : 'calc(50%)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`relative z-10 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                  billingCycle === 'monthly' ? 'text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`relative z-10 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                  billingCycle === 'yearly' ? 'text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                Annual
              </button>
            </div>

            <AnimatePresence>
              {billingCycle === 'yearly' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-gold font-sans font-bold text-sm"
                >
                  <Gift className="w-4 h-4" />
                  <span>Annual Commitment Reward: 10% Discount Applied</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Pricing Grid */}
        <div className={`grid grid-cols-1 ${PLANS.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-3'} gap-8 lg:gap-10`}>
          {PLANS.map((plan, idx) => {
            const isYearlyDisabled = billingCycle === 'yearly' && !plan.yearly;
            const pricing = isYearlyDisabled ? plan.monthly : (billingCycle === 'yearly' ? plan.yearly : plan.monthly);
            const moEquiv = monthlyEquivalent(plan);
            const isFeatured = plan.key === 'growth' || plan.badge === 'Best Value';

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

                  {plan.badge && (
                    <div className="absolute top-8 right-8">
                      <span className="bg-gold text-black text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-[0_0_20px_rgba(184,151,90,0.4)]">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-8 group-hover:border-gold/30 transition-colors duration-500">
                      <plan.icon className={`w-8 h-8 ${isFeatured ? 'text-gold' : 'text-white/80'}`} strokeWidth={1.5} />
                    </div>
                    
                    <h3 className="text-3xl font-display text-white mb-2">{plan.name}</h3>
                    <p className="text-white/40 text-sm font-sans mb-8 leading-relaxed">{plan.description}</p>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-sans font-bold tracking-tight text-white">
                        {billingCycle === 'monthly' && plan.launchPrice ? plan.launchPrice : pricing.amount}
                      </span>
                      <span className="text-white/30 text-base font-sans font-medium uppercase tracking-widest">
                        {billingCycle === 'yearly' ? '/yr' : '/mo'}
                      </span>
                    </div>

                    {billingCycle === 'monthly' && plan.launchPrice && (
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-gold/60 text-lg line-through font-sans decoration-gold/30">{plan.monthly.amount}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">Launch Phase</span>
                      </div>
                    )}

                    {moEquiv && (
                      <div className="mt-4 p-3 rounded-xl bg-gold/5 border border-gold/10 inline-block">
                        <p className="text-xs text-gold font-bold">
                          Efficiency: {moEquiv.mo} · Save {moEquiv.saved}/year
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 mb-12 flex-grow">
                    <div className="pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3 text-white/80 font-sans font-bold">
                        <ShieldCheck className="w-5 h-5 text-gold" />
                        <span className="text-sm tracking-wide uppercase">{plan.clients}</span>
                      </div>
                    </div>
                    
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-4 group/item">
                        <div className="mt-1 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors duration-300">
                          <Check className="w-3 h-3 text-white/20 group-hover:text-gold transition-colors duration-300" />
                        </div>
                        <span className="text-white/50 text-[13px] font-sans font-medium leading-relaxed group-hover:text-white transition-colors duration-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 border-t border-white/5">
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={!scriptLoaded || loadingPlan !== null}
                      className={`w-full py-5 rounded-[1.25rem] font-bold text-sm tracking-[0.1em] uppercase transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                        !scriptLoaded
                          ? 'bg-white/5 text-white/20 cursor-not-allowed'
                          : isFeatured
                          ? 'bg-gold text-black hover:shadow-[0_10px_40px_rgba(184,151,90,0.3)] hover:-translate-y-1'
                          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {loadingPlan === plan.key ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Elevate Now
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    {errorPlan.key === plan.key && (
                      <p className="mt-4 text-red-400 text-[10px] text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        {errorPlan.message}
                      </p>
                    )}

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

        {/* Footer / Trust Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <div className="inline-flex flex-col md:flex-row items-center gap-8 px-12 py-8 rounded-[3rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl">
            <div className="text-left">
              <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mb-2 block">Secure Enterprise Gateway</span>
              <div className="flex items-center gap-6">
                <span className="text-3xl font-display italic text-white/80">Razorpay</span>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-gold/40" />
                  <div className="text-left">
                    <p className="text-xs text-white/60 font-bold uppercase tracking-wider">PCI-DSS Level 1</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">Bank-grade encryption</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-[10px] text-white/20 uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
            All transactions are secure. Payment failures are handled automatically with instant status updates. 
            Need help? <span className="text-gold/50 cursor-pointer hover:text-gold transition-colors">Contact Enterprise Support</span>
          </p>
        </motion.div>
      </div>

      {/* Active Subscription Blocking Modal */}
      <AnimatePresence>
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

export default RazorpayCheckout;



