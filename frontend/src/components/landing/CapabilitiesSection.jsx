import { motion } from 'framer-motion';

const capabilities = [
  {
    number: "01",
    title: "Brand Memory",
    description: "CopyGen remembers every client's tone, power words, avoid-words, and CTA style. Every generation stays perfectly on-brand without re-explaining the brief."
  },
  {
    number: "02",
    title: "AI-Powered Generation",
    description: "Generate copy for Google Ads, Meta Ads, emails, blogs, LinkedIn and 12+ other formats instantly using state-of-the-art AI."
  },
  {
    number: "03",
    title: "Multi-Client Management",
    description: "Manage unlimited client profiles from one dashboard. Switch between brands instantly. No copy-paste, no confusion, no brand bleed."
  },
  {
    number: "04",
    title: "Agency-Grade Security",
    description: "Your client data stays private. Encrypted storage, isolated workspaces, zero data sharing between clients."
  }
];

export default function CapabilitiesSection() {
  return (
    <section className="w-full bg-[#ffffff] py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[1px] bg-[#c9a84c]" />
            <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold">
              Capabilities
            </span>
          </div>
          
          <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] mb-2">
            <span className="text-[#1a1a1a] block">Everything your agency needs.</span>
            <span className="text-[#6b7280] block">Nothing it doesn't.</span>
          </h2>
        </motion.div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#e5e7eb]/30">
          {capabilities.map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * (i + 1) }}
              className="bg-[#ffffff] p-8 border-t border-[#c9a84c]/30"
            >
              <div className="font-serif text-[48px] font-light text-[#c9a84c] mb-6 leading-none">
                {cap.number}
              </div>
              <h3 className="text-[#1a1a1a] text-[20px] font-bold mb-3">
                {cap.title}
              </h3>
              <p className="text-[#6b7280] text-[15px] leading-relaxed">
                {cap.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
