import { motion } from 'framer-motion';

const logos = [
  "BoldMark Agency", "Pixel & Co", "Growfast Digital", "ThinkBold Media", 
  "NextWave Marketing", "Verb Studio", "Brandcraft", "Reachify"
];

export default function LogoBar() {
  return (
    <section className="w-full bg-[#ffffff] py-12 border-b border-[#f3f4f6]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[12px] uppercase tracking-[0.2em] text-[#6b7280] font-bold mb-8"
        >
          Trusted by high-growth agencies worldwide
        </motion.p>
        
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 grayscale opacity-50">
          {logos.map((logo, i) => (
            <motion.span 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-[#1a1a1a] text-[18px] font-serif font-bold tracking-tight hover:opacity-100 transition-opacity cursor-default"
            >
              {logo}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
