import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "CopyGen cut our content turnaround from 3 days to 3 hours. Our clients think we hired three new copywriters.",
    author: "Priya Mehta",
    role: "Founder, BoldMark Agency"
  },
  {
    quote: "The Brand Memory feature actually writes like our client, not like a robot. It's the first AI tool that gets brand voice right.",
    author: "Arjun Shah",
    role: "Creative Director, Pixel & Co"
  },
  {
    quote: "We onboarded 4 new clients last month. CopyGen is the only reason we could handle the volume without burning out.",
    author: "Sneha Kulkarni",
    role: "CEO, Growfast Digital"
  },
  {
    quote: "Finally an AI tool built for agency workflows. Not for solo creators, not for developers — for agencies.",
    author: "Rahul Desai",
    role: "MD, ThinkBold Media"
  }
];

const logos = [
  "BoldMark Agency", "Pixel & Co", "Growfast Digital", "ThinkBold Media", 
  "NextWave Marketing", "Verb Studio", "Brandcraft", "Reachify"
];

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const next = () => setIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="w-full bg-[#ffffff] py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Block */}
        <div className="flex justify-between items-end mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold mb-4 block">
              What agencies say
            </span>
            <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] text-[#1a1a1a]">
              Trusted by agencies who ship.
            </h2>
          </motion.div>
          
          <div className="hidden md:flex gap-4">
            <button 
              onClick={prev}
              className="w-12 h-12 border border-[#e5e7eb] rounded-full flex items-center justify-center hover:bg-[#f9f9f9] transition-colors"
            >
              <ChevronLeft size={20} className="text-[#1a1a1a]" />
            </button>
            <button 
              onClick={next}
              className="w-12 h-12 border border-[#e5e7eb] rounded-full flex items-center justify-center hover:bg-[#f9f9f9] transition-colors"
            >
              <ChevronRight size={20} className="text-[#1a1a1a]" />
            </button>
          </div>
        </div>

        {/* Carousel Content */}
        <div 
          className="relative min-h-[400px] mb-12"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="font-serif text-[120px] text-[#c9a84c] opacity-20 absolute -top-16 -left-4 leading-none">
            "
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <blockquote className="font-serif italic text-[24px] md:text-[32px] text-[#1a1a1a] mb-8 leading-tight">
                {testimonials[index].quote}
              </blockquote>
              <div className="flex items-center gap-3">
                <span className="text-[#1a1a1a] text-[16px] font-bold">
                  {testimonials[index].author}
                </span>
                <span className="text-[#c9a84c] text-[8px]">●</span>
                <span className="text-[#6b7280] text-[14px]">
                  {testimonials[index].role}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Counter and Footer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 border-t border-[#f3f4f6] pt-12">
          <div className="text-[#1a1a1a] font-serif text-[20px]">
            <span className="font-bold">0{index + 1}</span>
            <span className="text-[#6b7280] mx-2">/</span>
            <span className="text-[#6b7280]">0{testimonials.length}</span>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[12px] uppercase tracking-widest text-[#6b7280] font-bold">
              Trusted by
            </span>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {logos.map((logo, i) => (
                <span 
                  key={i} 
                  className="text-[#1a1a1a] text-[14px] font-bold opacity-30 hover:opacity-100 transition-opacity cursor-default"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
