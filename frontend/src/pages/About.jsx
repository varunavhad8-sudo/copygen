import LandingNavbar from '../components/landing/LandingNavbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Target, Users, Sparkles, ShieldCheck } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-ivory text-ink font-sans selection:bg-gold selection:text-ivory">
      <Helmet>
        <title>Our Mission | Copygen — Powering the Future of Agencies</title>
        <meta name="description" content="Discover the story behind Copygen. We are on a mission to help marketing agencies scale human creativity through centralized AI intelligence and brand-voice memory." />
        <meta property="og:title" content="Our Mission | Copygen — Powering the Future of Agencies" />
        <meta property="og:description" content="Discover the story behind Copygen. We are on a mission to help marketing agencies scale human creativity." />
        <meta property="og:url" content="https://copygen.in/about" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Our Mission | Copygen" />
        <meta name="twitter:description" content="Discover the story behind Copygen and how we power modern marketing agencies." />
      </Helmet>
      <LandingNavbar />

      <main>
        {/* HERO SECTION */}
        <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-8"
          >
            Our Philosophy
          </motion.div>
          
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-ink leading-[1.05] tracking-tight mb-12 max-w-5xl">
            Empowering <span className="italic">agencies</span> to scale human creativity.
          </h1>
          
          <div className="h-px w-24 bg-gold mb-12 opacity-30" />
          
          <p className="text-xl md:text-2xl text-ink-muted max-w-3xl leading-relaxed font-light italic">
            "In 2026, the bottleneck for any agency isn't ideas — it's the execution time required to keep every client's voice consistent. We built Copygen to solve that."
          </p>
        </section>

        {/* MISSION STATS/CARDS */}
        <section className="py-24 px-6 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Target className="text-gold" />, title: "Precision", text: "We believe AI should sound like your client, not like a machine." },
              { icon: <Users className="text-gold" />, title: "Partnership", text: "Designed by agency founders for the teams they left behind." },
              { icon: <Sparkles className="text-gold" />, title: "Innovation", text: "Proprietary Brand Memory technology that lives in your OS." },
              { icon: <ShieldCheck className="text-gold" />, title: "Integrity", text: "Enterprise-grade data security and client isolation." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="premium-card p-10 rounded-2xl border border-border/50"
              >
                <div className="mb-6">{item.icon}</div>
                <h3 className="font-bold text-xl mb-4 tracking-tight">{item.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* THE CORE TEXT */}
        <section className="py-32 px-6 max-w-4xl mx-auto prose prose-ink lg:prose-xl">
          <h2 className="font-serif text-4xl mb-12">The Copygen Story</h2>
          <p className="text-ink-muted leading-relaxed mb-8 font-medium">
            Copygen was born out of a simple frustration: Agencies were spending 60% of their time on repetitive "junior-level" content checks instead of high-level strategy.
          </p>
          <p className="text-ink-muted leading-relaxed mb-8">
            We realized that general-purpose AI (like ChatGPT) was good at writing, but terrible at "knowing." It didn't know your client's unique tone, their quirks, or their competitors. Every session started from scratch.
          </p>
          <p className="text-ink-muted leading-relaxed mb-8">
            We built a platform that <strong className="text-ink">remembers</strong>. A platform that acts as a centralized brain for your entire agency roster. Today, Copygen helps hundreds of agencies deliver better work, faster, with 100% brand alignment.
          </p>
        </section>

        {/* TEAM/CULTURE SECTION */}
        <section className="py-32 px-6 bg-ink text-ivory overflow-hidden relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div>
                <span className="text-gold font-bold text-[10px] uppercase tracking-widest mb-6 block">Our Culture</span>
                <h2 className="font-serif text-5xl mb-8">Radical Efficiency, <br />Human Heart.</h2>
                <p className="text-ivory/60 leading-relaxed mb-10 max-w-md">
                  We are a distributed team of researchers, designers, and agency veterans building the future of marketing work. We prioritize results over hours, and quality over quantity.
                </p>
                <button className="px-8 py-4 bg-gold text-ink font-bold text-sm rounded-xl hover:bg-gold-light transition-all">
                  Join the Mission
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[4/5] bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1707312154546-f9479679930f?q=80&w=2670&auto=format&fit=crop" 
                    alt="Luxury Lobby" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
                <div className="aspect-[4/5] bg-gold/10 rounded-2xl border border-gold/20 overflow-hidden shadow-2xl">
                   <img 
                    src="/src/assets/brand-memory.png" 
                    alt="AI Dashboard" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;



