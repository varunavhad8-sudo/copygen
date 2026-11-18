import { motion } from 'framer-motion';

const steps = [
  {
    numeral: "I",
    title: "Add Your Client",
    description: "Create a client profile with their brand voice, target audience, power words, and avoid-words. Takes 2 minutes. Saves hours every week."
  },
  {
    numeral: "II",
    title: "Generate Copy",
    description: "Pick a format, enter a brief, and CopyGen generates perfectly on-brand copy instantly. No prompt engineering needed."
  },
  {
    numeral: "III",
    title: "Export and Ship",
    description: "Deliver polished copy to clients faster than any human writer without ever sacrificing brand consistency."
  }
];

export default function ProcessSection() {
  return (
    <section className="w-full bg-[#f9f9f9] py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold mb-4 block">
            Process
          </span>
          <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] mb-2">
            <span className="text-[#1a1a1a] block">Three steps.</span>
            <span className="text-[#6b7280] block">Unlimited copy.</span>
          </h2>
        </motion.div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[1px] bg-[#c9a84c]/20 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 * i }}
                className="text-center"
              >
                <div className="font-serif text-[72px] text-[#c9a84c] mb-4 leading-none bg-[#f9f9f9] inline-block px-4">
                  {step.numeral}
                </div>
                <h3 className="text-[#1a1a1a] text-[20px] font-bold mb-3">
                  {step.title}
                </h3>
                <p className="text-[#6b7280] text-[15px] leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
