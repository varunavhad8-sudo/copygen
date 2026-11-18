import LandingNavbar from '../components/landing/LandingNavbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, TrendingUp, Clock, Shield } from 'lucide-react';
import BrandMemoryImg from '../assets/brand-memory.png';

const Work = () => {

  const CASE_STUDIES = [
    {
      agency: "NeoMedia Global",
      highlight: "10x Content Velocity",
      description: "How a 50-person agency automated their entire performance creative workflow for 20+ retail clients.",
      result: "400% ROI",
      image: BrandMemoryImg
    },
    {
      agency: "The Brand Lab",
      highlight: "Zero Tone Drift",
      description: "Managing complex brand voices for high-end luxury jewelry brands without using human 'junior' checkers.",
      result: "99% Accuracy",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2340&auto=format&fit=crop"
    },
    {
      agency: "ScaleSocial",
      highlight: "Unlimited Scaling",
      description: "Scaling from 5 to 50 clients in 3 months by automating the 'first draft' process across all platforms.",
      result: "60% Cost Saving",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2340&auto=format&fit=crop"
    }
  ];

  return (
    <div className="bg-ivory text-ink font-sans selection:bg-gold selection:text-ivory overflow-x-hidden">
      <Helmet>
        <title>Case Studies | Copygen — Success Stories from Top Agencies</title>
        <meta name="description" content="Explore how marketing agencies use Copygen to achieve 10x content velocity and 100% brand voice consistency. Read our agency success stories." />
        <meta property="og:title" content="Case Studies | Copygen" />
        <meta property="og:description" content="Real results: agencies achieving 10x content velocity and 400% ROI with Copygen." />
        <meta property="og:url" content="https://copygen.in/work" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Agency Success Stories | Copygen" />
        <meta name="twitter:description" content="Explore how top agencies use Copygen to scale content without scaling headcount." />
      </Helmet>
      <LandingNavbar />

      <main>
        {/* HERO */}
        <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-8"
          >
            The Results
          </motion.div>
          
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-ink leading-[1.05] tracking-tight mb-8 max-w-5xl">
            Where efficiency meets <br /> <span className="italic">excellence.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-ink-muted max-w-2xl leading-relaxed">
            We don't just ship features; we ship outcomes. Discover how modern agencies are using Copygen to redefine their bottom line.
          </p>
        </section>

        {/* FEATURED CASE STUDY - LARGE */}
        <section className="py-24 px-6 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto">
            <div className="premium-card bg-ivory rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row items-stretch border-none">
              <div className="lg:w-1/2 relative min-h-[400px]">
                <img 
                  src={CASE_STUDIES[0].image} 
                  alt="Case Study" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-ink/20" />
              </div>
              <div className="lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center">
                <span className="text-gold font-bold text-[10px] uppercase tracking-widest mb-6 block">Featured Story</span>
                <h2 className="font-serif text-4xl text-ink mb-6">{CASE_STUDIES[0].agency}</h2>
                <p className="text-ink-muted leading-relaxed mb-10 text-lg">
                  {CASE_STUDIES[0].description}
                </p>
                <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="flex gap-3">
                     <TrendingUp className="text-gold" />
                     <div>
                       <div className="font-black text-2xl">{CASE_STUDIES[0].result}</div>
                       <div className="text-[10px] uppercase font-bold text-ink-muted tracking-widest">Growth Metric</div>
                     </div>
                   </div>
                   <div className="flex gap-3">
                     <Clock className="text-gold" />
                     <div>
                       <div className="font-black text-2xl">92%</div>
                       <div className="text-[10px] uppercase font-bold text-ink-muted tracking-widest">Time Reclaimed</div>
                     </div>
                   </div>
                </div>
                <button className="flex items-center gap-2 text-ink font-bold hover:text-gold transition-colors text-sm uppercase tracking-widest">
                  Read Full Study <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY GRID */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            {CASE_STUDIES.slice(1).map((cs, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="group flex flex-col"
              >
                <div className="aspect-video bg-white rounded-2xl overflow-hidden mb-8 relative border border-border shadow-xl">
                  <img src={cs.image} alt={cs.agency} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent flex items-end p-8">
                     <div className="text-ivory font-serif text-2xl">{cs.highlight}</div>
                  </div>
                </div>
                <h3 className="font-serif text-3xl mb-4 text-ink">{cs.agency}</h3>
                <p className="text-ink-muted leading-relaxed mb-8 flex-grow">
                  {cs.description}
                </p>
                <div className="flex items-center justify-between pt-8 border-t border-border">
                   <div className="text-gold font-black text-xl">{cs.result}</div>
                   <button className="text-[10px] uppercase font-black tracking-widest text-ink/40 hover:text-gold transition-colors">Case Details →</button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CAPABILITIES STRIP */}
        <section className="py-24 bg-ink text-ivory text-center">
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { i: <Shield size={32} />, t: "Secure Memory", d: "Client data is isolated and encrypted at the hardware level." },
                { i: <Clock size={32} />, t: "24/7 Production", d: "Your 'team' never sleeps, handling mundane briefs overnight." },
                { i: <TrendingUp size={32} />, t: "Predictable ROI", d: "Reduce creative overhead by an average of 65% in 30 days." }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="text-gold mb-6">{item.i}</div>
                  <h4 className="font-bold text-lg mb-3 tracking-tight">{item.t}</h4>
                  <p className="text-ivory/40 text-sm leading-relaxed">{item.d}</p>
                </div>
              ))}
           </div>
        </section>

        {/* CTA */}
        <section className="py-40 px-6 bg-ivory text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="font-serif text-5xl md:text-7xl mb-12">The proof is in the <span className="italic text-gold italic underline decoration-gold/30">production.</span></h2>
            <button className="px-12 py-5 bg-ink text-ivory font-bold rounded-xl hover:bg-gold transition-all duration-300">
              Start your free pilot
            </button>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 blur-[100px] rounded-full pointer-events-none" />
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Work;



