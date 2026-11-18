import LandingNavbar from '../components/landing/LandingNavbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Brain, Zap, Search, Layout, Database, MessageSquare } from 'lucide-react';

const Services = () => {
  return (

    <div className="bg-ivory text-ink font-sans selection:bg-gold selection:text-ivory">
      <Helmet>
        <title>Services &amp; AI Solutions | Copygen — The Agency OS</title>
        <meta name="description" content="Boost your agency performance with Copygen solutions. Brand Memory systems, Strategic Content Velocity, and SEO-optimized generation for modern creative teams." />
        <meta property="og:title" content="Services & AI Solutions | Copygen" />
        <meta property="og:description" content="Brand Memory, Content Velocity, SEO Intelligence — all in one agency OS." />
        <meta property="og:url" content="https://copygen.in/services" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Services | Copygen" />
        <meta name="twitter:description" content="Brand Memory systems, content velocity, and SEO intelligence for modern agencies." />
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
            The Capabilities
          </motion.div>
          
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-ink leading-[1.05] tracking-tight mb-8 max-w-4xl">
            A full creative suite <br /> in <span className="italic">one ecosystem.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-ink-muted max-w-2xl leading-relaxed">
            Copygen isn't just a chatbot. It's a structured operating system designed to handle the heavy lifting of agency production.
          </p>
        </section>

        {/* CORE SERVICES GRID */}
        <section className="py-24 px-6 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { 
                icon: <Brain className="text-gold" size={32} />, 
                title: "Brand Memory Systems", 
                text: "We build persistent intelligence models for every client. Our AI remembers their specific terminology, prohibited words, and stylistic nuances across every project."
              },
              { 
                icon: <Zap className="text-gold" size={32} />, 
                title: "Content Velocity", 
                text: "Reduce production time from days to seconds. Generate blog posts, email sequences, and ad copy that actually passes the 'human test' on the first try."
              },
              { 
                icon: <Search className="text-gold" size={32} />, 
                title: "SEO Intelligence", 
                text: "Our engine analyzes top-ranking SERPs to inject LSI keywords and semantic structure into every brief and article automatically."
              },
              { 
                icon: <Layout className="text-gold" size={32} />, 
                title: "Strategic Briefs", 
                text: "Generate comprehensive creative briefs that align with client goals. Perfect for handovers or as a foundation for deep creative work."
              },
              { 
                icon: <Database className="text-gold" size={32} />, 
                title: "Client Isolation", 
                text: "Enterprise-grade data management. Ensure Client A's data and voice never mix with Client B's. Perfect security for multi-roster agencies."
              },
              { 
                icon: <MessageSquare className="text-gold" size={32} />, 
                title: "Omnichannel Social", 
                text: "Instantly translate a single idea into optimized formats for LinkedIn, X, Instagram, and TikTok, maintaining voice while adapting for the platform."
              }
            ].map((s, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 group"
              >
                <div className="mb-8 p-4 bg-ivory rounded-2xl w-fit transition-transform group-hover:rotate-6 group-hover:bg-gold-light/20">
                  {s.icon}
                </div>
                <h3 className="font-serif text-2xl mb-4 tracking-tight text-ink">{s.title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{s.text}</p>
                <div className="mt-8 h-px w-0 bg-gold transition-all duration-500 group-hover:w-full" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURE HIGHLIGHT: BRAND VOICE */}
        <section className="py-32 px-6 bg-ivory overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="premium-card bg-ink p-2 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="p-6 bg-ink text-ivory text-[10px] font-black uppercase tracking-widest flex justify-between">
                  <span>Voice Extraction Unit</span>
                  <span className="text-gold animate-pulse">Running Instruction</span>
                </div>
                <div className="aspect-video relative">
                  <video 
                    src="https://cdn.pixabay.com/video/2022/08/19/128393-741176964_large.mp4" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-ink/40 pointer-events-none" />
                </div>
                {/* Decorative overlay */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gold/20 blur-[60px] rounded-full" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-gold font-bold text-[10px] uppercase tracking-widest mb-6 block">Voice instruction Demo</span>
              <h2 className="font-serif text-5xl text-ink leading-tight mb-8">How workplace works with <br /><span className="italic underline decoration-gold/30">voice memory.</span></h2>
              <p className="text-ink-muted leading-relaxed mb-10">
                Copygen doesn't just listen; it understands intent. By capturing your brand's recorded voice, we build a linguistic model that matches your tone, cadence, and vocabulary perfectly. Transition your agency from "writing" to "directing."
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 px-6 bg-ink text-ivory text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-5xl mb-8">Ready to transform your agency roster?</h2>
            <p className="text-ivory/60 mb-12 max-w-xl mx-auto leading-relaxed">
              Join the elite group of agencies who have automated the "junior work" and reclaimed their time for real strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="px-10 py-5 bg-gold text-ink font-bold rounded-xl hover:bg-gold-light transition-all">Start Free 14-Day Trial</button>
              <button className="px-10 py-5 border border-white/20 text-ivory font-bold rounded-xl hover:bg-white/5 transition-all">Download Platform Deck</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;



