import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

// Component Imports
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import LogoBar from '../components/landing/LogoBar';
import CapabilitiesSection from '../components/landing/CapabilitiesSection';
import TickerSection from '../components/landing/TickerSection';
import BrandMemorySection from '../components/landing/BrandMemorySection';
import StrategicProcess from '../components/landing/ProcessSection';
import TacticalWorkflow from '../components/landing/TacticalWorkflow';
import StatsSection from '../components/landing/StatsSection';
import FormatsMarquee from '../components/landing/IntegrationsMarquee';
import AgenciesSection from '../components/landing/AgenciesSection';
import FeatureCards from '../components/landing/FeatureCards';
import SecuritySection from '../components/landing/SecuritySection';
import OutputProofSection from '../components/landing/OutputProofSection';
import TestimonialsCarousel from '../components/landing/TestimonialsSection';
import TestimonialsGrid from '../components/landing/TestimonialsGrid';
import PricingCards from '../components/landing/PricingSection';
import PricingBanner from '../components/landing/PricingBanner';
import FinalCTA from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  // Capture ?ref= query param and persist to localStorage for signup attribution
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('copygen_ref', ref);
  }, []);

  return (
    <div className="bg-ivory selection:bg-gold/30 selection:text-ink">
      <Helmet>
        <title>CopyGen — AI Copy Generator for Marketing Agencies with Brand Memory</title>
        <meta name="description" content="The unified Marketing Operating System for high-performance agencies. CopyGen uses Brand Memory to create context-aware copy that converts." />
        
        {/* SEO Schema.org */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "CopyGen",
              "operatingSystem": "Web",
              "applicationCategory": "MarketingApplication",
              "offers": {
                "@type": "Offer",
                "price": "99.00",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "128"
              }
            }
          `}
        </script>
      </Helmet>
      
      <LandingNavbar />

      <main>
        <h2 className="sr-only">CopyGen — AI Copy Generator for Marketing Agencies with Brand Memory</h2>

        {/* 1. HERO */}
        <HeroSection />

        {/* 2. LOGO BAR */}
        <LogoBar />

        {/* 3. CAPABILITIES */}
        <CapabilitiesSection />

        {/* 4. TICKER (INDUSTRIES) */}
        <TickerSection />

        {/* 5. BRAND MEMORY */}
        <BrandMemorySection />

        {/* 6. STRATEGIC PROCESS */}
        <StrategicProcess />

        {/* 7. TACTICAL WORKFLOW */}
        <TacticalWorkflow />

        {/* 8. STATS */}
        <StatsSection />

        {/* 9. FORMATS MARQUEE */}
        <FormatsMarquee />

        {/* 10. AGENCIES */}
        <AgenciesSection />

        {/* 11. FEATURE CARDS */}
        <FeatureCards />

        {/* 12. SECURITY */}
        <SecuritySection />

        {/* 13. OUTPUT PROOF */}
        <OutputProofSection />

        {/* 14. TESTIMONIALS CAROUSEL */}
        <TestimonialsCarousel />

        {/* 15. TESTIMONIALS GRID */}
        <TestimonialsGrid />

        {/* 16. PRICING CARDS */}
        <PricingCards />

        {/* 17. PRICING BANNER */}
        <PricingBanner />

        {/* 18. FINAL CTA */}
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
