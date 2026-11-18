import { motion } from 'framer-motion';

const points = [
  {
    number: "01",
    title: "No prompt engineering needed",
    description: "Describe the client once. CopyGen handles all prompting automatically behind the scenes."
  },
  {
    number: "02",
    title: "Brand consistency at scale",
    description: "Every output matches your client's voice, every single time. No more off-brand copy."
  },
  {
    number: "03",
    title: "Bulk generation ready",
    description: "Generate 10 ad variants in the time it takes to write one manually."
  },
  {
    number: "04",
    title: "White-label exports",
    description: "Deliver polished copy directly to clients under your agency's name."
  }
];

export default function AgenciesSection() {
  return (
    <section className="w-full bg-[#f9f9f9] py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold mb-4 block">
            For Agencies
          </span>
          <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] mb-6 text-[#1a1a1a]">
            <span className="block text-[#1a1a1a]">Built for agencies.</span>
            <span className="block text-[#6b7280]">Not for prompt engineers.</span>
          </h2>
          <p className="text-[#6b7280] text-[16px] leading-relaxed max-w-lg mx-auto">
            No AI learning curve. No prompt templates. Just brief in, copy out.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {points.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="border-l-2 border-[#c9a84c] pl-6"
            >
              <div className="font-serif text-[24px] font-bold text-[#c9a84c] mb-2">
                {point.number}
              </div>
              <h3 className="text-[#1a1a1a] text-[18px] font-bold mb-2">
                {point.title}
              </h3>
              <p className="text-[#6b7280] text-[14px] leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
