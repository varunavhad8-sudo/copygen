import { motion, useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 12, suffix: "+", label: "Content Formats" },
  { value: 500, suffix: "k+", label: "Words Generated" },
  { value: 3, prefix: "<", suffix: "sec", label: "Generation Speed" },
  { value: "∞", label: "Client Profiles", isStatic: true }
];

function StatBox({ stat, index }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && !stat.isStatic) {
      const controls = animate(0, stat.value, {
        duration: 2,
        ease: "easeOut",
        onUpdate(value) {
          setDisplayValue(stat.decimals ? value.toFixed(stat.decimals) : Math.floor(value));
        }
      });
      return () => controls.stop();
    }
  }, [isInView, stat]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-8 border border-[#e5e7eb] flex flex-col justify-center"
    >
      <div className="font-serif text-[56px] font-bold text-[#1a1a1a] leading-none mb-2">
        {stat.isStatic ? stat.value : (
          <>
            {stat.prefix}
            {displayValue}
            {stat.suffix}
          </>
        )}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-[#6b7280]">
        {stat.label}
      </div>
    </motion.div>
  );
}

export default function StatsSection() {
  return (
    <section className="w-full bg-[#ffffff] py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Left Column */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold mb-4 block">
            Scale
          </span>
          <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] mb-6">
            <span className="text-[#1a1a1a] block">Built for agencies.</span>
            <span className="text-[#6b7280] block">Ready to scale.</span>
          </h2>
          <p className="text-[#6b7280] text-[16px] leading-relaxed max-w-md">
            From solo consultants to 50-person agencies — CopyGen handles your entire client roster without slowing down.
          </p>
        </motion.div>

        {/* Right Column - Stats Grid */}
        <div className="grid grid-cols-2 gap-px bg-[#e5e7eb]/20">
          {stats.map((stat, i) => (
            <StatBox key={i} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
