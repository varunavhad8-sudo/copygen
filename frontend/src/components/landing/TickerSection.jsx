import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

const INDUSTRIES = [
  "Blog Posts", "Ad Copy", "Email Sequences", 
  "SEO Briefs", "Social Captions", "Brand Voice AI", 
  "Landing Pages"
];

export default function TickerSection() {
  return (
    <div className="py-6 bg-gold-light border-y border-gold/10 overflow-hidden select-none">
      <div className="flex animate-infinite-scroll whitespace-nowrap gap-12 text-gold font-serif text-2xl uppercase italic font-bold">
        {[...INDUSTRIES, ...INDUSTRIES].map((item, i) => (
          <span key={i} className="flex items-center gap-12">
            {item} <span className="text-gold/40 not-italic font-sans text-xs">•</span>
          </span>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(`
        @keyframes infinite-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 40s linear infinite;
        }
      `, { ADD_TAGS: ['style'] }) }} />
    </div>
  );
}
