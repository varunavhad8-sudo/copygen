import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    number: "01",
    name: "Starter",
    subtitle: "For freelancers and small agencies",
    monthlyPrice: 99,
    features: [
      "10 client profiles",
      "300 generations/month",
      "12 content formats",
      "Email support",
      "Brand Memory included"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    number: "02",
    name: "Growth",
    subtitle: "For growing agencies",
    monthlyPrice: 299,
    features: [
      "30 client profiles",
      "1000 generations/month",
      "All 15 formats",
      "Priority support",
      "Advanced analytics",
      "3 team seats"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    number: "03",
    name: "Agency",
    subtitle: "For large agencies",
    monthlyPrice: 599,
    features: [
      "100 client profiles",
      "3000 generations/month",
      "All formats + custom",
      "Dedicated support",
      "White-label exports",
      "10 team seats"
    ],
    cta: "Contact Sales",
    popular: false
  }
];


export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="w-full bg-[#f9f9f9] py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold mb-4 block">
              Pricing
            </span>
            <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] text-[#1a1a1a] mb-6">
              Simple, transparent pricing.
            </h2>
            <p className="text-[#6b7280] text-[16px] mb-10">
              Start free for 7 days. No credit card required.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-[14px] ${!isAnnual ? 'text-[#1a1a1a] font-bold' : 'text-[#6b7280]'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 bg-[#e5e7eb] rounded-full relative transition-colors duration-300"
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-[#c9a84c] rounded-full transition-transform duration-300 ${isAnnual ? 'translate-x-6' : ''}`} />
              </button>
              <span className={`text-[14px] ${isAnnual ? 'text-[#1a1a1a] font-bold' : 'text-[#6b7280]'}`}>Annual</span>
              {isAnnual && (
                <span className="bg-[#c9a84c]/10 text-[#c9a84c] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Save 20%
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0, scale: plan.popular ? 1.03 : 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`bg-white rounded-xl p-8 flex flex-col relative ${plan.popular ? 'border-2 border-[#c9a84c] shadow-2xl shadow-gold/5' : 'border border-[#e5e7eb]'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a84c] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="font-serif text-[18px] text-[#c9a84c] font-bold mb-6">
                {plan.number}
              </div>

              <h3 className="text-[#1a1a1a] text-[24px] font-bold mb-2">{plan.name}</h3>
              <p className="text-[#6b7280] text-[14px] mb-8">{plan.subtitle}</p>
              
              <div className="mb-10">
                <span className="font-serif text-[48px] font-bold text-[#1a1a1a]">
                  ${isAnnual ? Math.floor(plan.monthlyPrice * 0.8) : plan.monthlyPrice}
                </span>
                <span className="text-[#6b7280] text-[14px] ml-2">/month</span>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check size={16} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                    <span className="text-[#6b7280] text-[14px]">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-xl font-bold text-[14px] transition-all ${
                plan.popular 
                  ? 'bg-[#c9a84c] text-white hover:bg-[#b8973d]' 
                  : 'border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/5'
              }`}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center mt-12 text-[#6b7280] text-[13px]">
          All plans include 7-day free trial, Brand Memory, and encrypted client workspaces.
        </p>

      </div>
    </section>
  );
}
