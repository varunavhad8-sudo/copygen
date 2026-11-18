import { motion } from 'framer-motion';

const securityPoints = [
  {
    title: "Encrypted Storage",
    description: "All client data encrypted at rest and in transit using 256-bit encryption. No exceptions."
  },
  {
    title: "Zero Training on Your Data",
    description: "We never use your content to train AI models. Your copy stays 100% yours."
  },
  {
    title: "Isolated Client Workspaces",
    description: "Brand A never sees Brand B. Complete separation across all client profiles."
  },
  {
    title: "GDPR Ready",
    description: "Built with data privacy at the core. Compliant for Indian and international agency operations."
  }
];

const badges = [
  "256-bit Encryption",
  "Zero Data Training",
  "Private Workspaces",
  "GDPR Ready"
];

export default function SecuritySection() {
  return (
    <section className="w-full bg-[#ffffff] py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold mb-4 block">
            Trust
          </span>
          <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] mb-6 text-[#1a1a1a]">
            Your client data is non-negotiable.
          </h2>
          <p className="text-[#6b7280] text-[16px] leading-relaxed mb-8 max-w-md">
            We don't train on your data. We don't share between workspaces. Your clients' brand secrets stay yours.
          </p>
          
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, i) => (
              <div 
                key={i} 
                className="border border-[#c9a84c] text-[#c9a84c] rounded-full px-3 py-1 text-[12px] font-medium"
              >
                {badge}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-0">
          {securityPoints.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="py-6 border-b border-[#f3f4f6] last:border-0"
            >
              <div className="flex items-start gap-4">
                <span className="text-[#c9a84c] text-[20px] leading-none mt-1">✓</span>
                <div>
                  <h3 className="text-[#1a1a1a] text-[16px] font-bold mb-1">
                    {point.title}
                  </h3>
                  <p className="text-[#6b7280] text-[14px] leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
