import { Link } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import LandingFooter from "../components/landing/LandingFooter";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      <LandingNavbar />
      
      <main className="max-w-3xl mx-auto px-6 py-24 mt-16">
        <Link to="/" className="inline-block text-muted-foreground hover:text-foreground transition-colors mb-8">
          ← Back to Home
        </Link>
        
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-6">
          Terms of Service — CopyGen.in
        </h1>
        <div className="mb-12">
          <span className="inline-block px-3 py-1 bg-foreground/10 text-muted-foreground text-sm font-mono rounded-full">
            Last Updated: May 9, 2026
          </span>
        </div>
        
        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">
          <p>
            Welcome to CopyGen.in ("we", "our", or "us"). By accessing or using our AI copywriting platform (the "Service"), you ("User", "Agency", or "Customer") agree to be bound by these Terms of Service.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">1. Account Registration and Security</h2>
          <p>
            To use CopyGen.in, you must register for an account. You agree to provide accurate information and are solely responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account, including those by team members utilizing your Agency seats.
            <br /><br />
            You must be at least 18 years of age to create an account and use the Service. By registering, you confirm that you meet this age requirement.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">2. Subscriptions and Billing</h2>
          <p>
            CopyGen.in operates on a subscription basis (Starter, Pro, and Agency tiers) billed monthly or annually in INR (₹).
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Free Trial:</strong> We offer a 7-day free trial. If you do not cancel before the trial ends, your payment method will be charged for the selected subscription.</li>
            <li><strong>Payment:</strong> By providing payment details, you authorize us to charge your subscription fees automatically.</li>
            <li><strong>Modifications:</strong> We reserve the right to modify pricing with 30 days prior notice.</li>
          </ul>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">3. Intellectual Property and Content Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Your Input and Output:</strong> You retain all ownership rights to the prompts, client profiles, and brand memory details you input into the Service. You also own all the generated copy output provided by the Service.</li>
            <li><strong>Our Technology:</strong> We retain all rights, title, and interest in the CopyGen.in platform, its underlying software, algorithms, and interfaces.</li>
          </ul>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">4. Acceptable Use</h2>
          <p>
            You agree not to use CopyGen.in to generate unlawful, defamatory, or harmful content. You may not reverse engineer the platform or use automated systems (bots/scrapers) to access the Service outside of our provided APIs.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, CopyGen.in shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to loss of clients, data, or revenue.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">6. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the competent courts located in Akola, Maharashtra, India. Both parties agree to attempt good-faith resolution before initiating legal proceedings.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">7. AI-Generated Content Disclaimer</h2>
          <p>
            CopyGen.in provides AI-assisted copywriting as a tool to augment your agency's workflow. All AI-generated content is provided 'as-is'. You acknowledge that AI output may contain errors, inaccuracies, or unintended similarities to third-party content. You are solely responsible for reviewing all generated copy before use. CopyGen.in makes no warranties regarding the originality, accuracy, or fitness of AI-generated content for any particular purpose.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">8. Force Majeure</h2>
          <p>
            CopyGen.in shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to acts of God, internet outages, third-party service failures (including AI provider downtime), government actions, or other circumstances beyond our reasonable control.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">9. Changes to These Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. We will notify you of significant changes via email to your registered address with at least 14 days notice. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">10. Contact Us</h2>
          <p>
            For any questions regarding these Terms of Service, please contact us at hello@copygen.in
          </p>

          <div className="mt-16 pt-8 border-t border-foreground/10 text-xs text-muted-foreground">
            These policies were last reviewed on May 9, 2026. For questions contact hello@copygen.in
          </div>
        </div>
      </main>
      
      <LandingFooter />
    </div>
  );
}
