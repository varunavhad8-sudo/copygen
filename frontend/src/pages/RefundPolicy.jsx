import { Link } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import LandingFooter from "../components/landing/LandingFooter";

export default function RefundPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      <LandingNavbar />
      
      <main className="max-w-3xl mx-auto px-6 py-24 mt-16">
        <Link to="/" className="inline-block text-muted-foreground hover:text-foreground transition-colors mb-8">
          ← Back to Home
        </Link>
        
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-6">
          Refund Policy — CopyGen.in
        </h1>
        <div className="mb-12">
          <span className="inline-block px-3 py-1 bg-foreground/10 text-muted-foreground text-sm font-mono rounded-full">
            Last Updated: May 9, 2026
          </span>
        </div>
        
        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">
          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">1. 7-Day Free Trial</h2>
          <p>
            All new accounts are eligible for a 7-day free trial. During this period, you have full access to evaluate the platform. If you cancel your account before the 7 days are over, you will not be charged.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">2. Subscription Refunds</h2>
          <p>
            Due to the high computing costs associated with AI generation, we do not offer refunds for any subscription fees once your card has been charged. This applies to both monthly and annual billing cycles.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">3. Cancellations</h2>
          <p>
            You may cancel your subscription at any time from your account billing dashboard.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Continued Access:</strong> Your account will remain active until the end of your current paid billing cycle.</li>
            <li><strong>Data Retention:</strong> Upon end of billing cycle, your account will be downgraded. We will securely retain your Brand Memory and client profiles for 30 days, after which they may be permanently deleted.</li>
          </ul>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">4. Exceptions</h2>
          <p>
            If you believe you have been charged in error due to a technical glitch, contact hello@copygen.in within 7 days of the charge and we will review on a case-by-case basis.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">5. Annual Billing</h2>
          <p>
            Users on annual billing plans who wish to cancel within the first 7 days of their paid annual subscription (after the free trial) may contact hello@copygen.in to request a review. We do not guarantee refunds on annual plans but will review exceptional circumstances on a case-by-case basis.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">6. Contact for Billing Issues</h2>
          <p>
            For all billing-related queries, disputes, or concerns, contact us at hello@copygen.in. We aim to respond to all billing queries within 2 business days.
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
