const row1 = [
  "Google Ads", "Meta Ads", "Email Campaigns", "Blog Posts", "LinkedIn Posts", "Instagram Captions",
  "Google Ads", "Meta Ads", "Email Campaigns", "Blog Posts", "LinkedIn Posts", "Instagram Captions"
];

const row2 = [
  "SEO Content", "Press Releases", "Product Descriptions", "YouTube Scripts", "WhatsApp Copy", "Landing Pages",
  "SEO Content", "Press Releases", "Product Descriptions", "YouTube Scripts", "WhatsApp Copy", "Landing Pages"
];

export default function IntegrationsMarquee() {
  return (
    <section className="w-full bg-[#f9f9f9] py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-[12px] font-bold mb-4 block">
          Formats
        </span>
        <h2 className="font-serif text-[36px] md:text-[56px] font-bold leading-[1.1] mb-6 text-[#1a1a1a]">
          Works across every format your clients need.
        </h2>
        <p className="text-[#6b7280] text-[16px] leading-relaxed">
          12+ content formats supported out of the box.
        </p>
      </div>

      <div className="relative space-y-8">
        {/* Row 1: Scrolls Left */}
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex gap-6 animate-marquee whitespace-nowrap px-6">
            {row1.map((item, i) => (
              <div key={i} className="bg-white border border-[#e5e7eb] px-6 py-3 rounded-full flex items-center gap-3 shadow-sm">
                <span className="text-[#c9a84c] text-[10px]">●</span>
                <span className="text-[#1a1a1a] text-[14px] font-medium">{item}</span>
              </div>
            ))}
          </div>
          {/* Double for seamless scroll */}
          <div className="flex gap-6 animate-marquee whitespace-nowrap px-6" aria-hidden="true">
            {row1.map((item, i) => (
              <div key={i} className="bg-white border border-[#e5e7eb] px-6 py-3 rounded-full flex items-center gap-3 shadow-sm">
                <span className="text-[#c9a84c] text-[10px]">●</span>
                <span className="text-[#1a1a1a] text-[14px] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Scrolls Right */}
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex gap-6 animate-marquee-reverse whitespace-nowrap px-6">
            {row2.map((item, i) => (
              <div key={i} className="bg-white border border-[#e5e7eb] px-6 py-3 rounded-full flex items-center gap-3 shadow-sm">
                <span className="text-[#c9a84c] text-[10px]">●</span>
                <span className="text-[#1a1a1a] text-[14px] font-medium">{item}</span>
              </div>
            ))}
          </div>
          {/* Double for seamless scroll */}
          <div className="flex gap-6 animate-marquee-reverse whitespace-nowrap px-6" aria-hidden="true">
            {row2.map((item, i) => (
              <div key={i} className="bg-white border border-[#e5e7eb] px-6 py-3 rounded-full flex items-center gap-3 shadow-sm">
                <span className="text-[#c9a84c] text-[10px]">●</span>
                <span className="text-[#1a1a1a] text-[14px] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 30s linear infinite;
        }
      ` }} />
    </section>
  );
}
