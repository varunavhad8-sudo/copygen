import { Link } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import LandingFooter from "../components/landing/LandingFooter";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      <LandingNavbar />
      
      <main className="max-w-3xl mx-auto px-6 py-24 mt-16">
        <Link to="/" className="inline-block text-muted-foreground hover:text-foreground transition-colors mb-8">
          ← Back to Home
        </Link>
        
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-6">
          Privacy Policy — CopyGen.in
        </h1>
        <div className="mb-12">
          <span className="inline-block px-3 py-1 bg-foreground/10 text-muted-foreground text-sm font-mono rounded-full">
            Last Updated: May 9, 2026
          </span>
        </div>
        
        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">
          <p>
            At CopyGen.in, we take your agency's and your clients' privacy incredibly seriously. This policy outlines how we collect, use, and protect your data.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">1. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, company name, and payment information.</li>
            <li><strong>Usage Data:</strong> Analytics regarding how you interact with our platform to help us improve user experience.</li>
            <li><strong>Client Data (Brand Memory):</strong> The brand voices, target audiences, and style preferences you save for your clients.</li>
          </ul>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">2. Zero Data Training Policy</h2>
          <p>
            We do not use your data or your clients' data to train our AI models. Your inputs, prompts, and generated copy are processed solely to fulfill your specific request and are never shared with or used to train external LLM providers (e.g., OpenAI, Anthropic).
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">3. Isolated Workspaces and Security</h2>
          <p>
            All client data is encrypted at rest and in transit using 256-bit encryption. We utilize strict role-based access control and isolated client workspaces. Brand A's data will never bleed into or be accessible by Brand B.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">4. Third-Party Service Providers</h2>
          <p>
            We share necessary information with trusted third parties strictly for operational purposes, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Razorpay (Indian payment processing)</li>
            <li>Dodo Payments (international payment processing)</li>
            <li>Firebase by Google (authentication and database)</li>
            <li>OpenAI and Anthropic (AI generation — processing only, no training)</li>
            <li>Railway (backend hosting)</li>
            <li>Vercel (frontend hosting)</li>
          </ul>
          <p>
            These providers are bound by strict confidentiality agreements.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">5. GDPR and Data Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data at any time. To permanently delete your agency account and all associated client data, contact us at hello@copygen.in.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">6. Cookies and Tracking</h2>
          <p>
            CopyGen.in uses essential cookies to maintain your login session and platform functionality. We use Firebase Authentication cookies which are strictly necessary for the Service to function. We do not use advertising cookies or third-party tracking cookies. You may disable cookies in your browser settings, however this will prevent you from logging into the platform.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">7. Data Breach Notification</h2>
          <p>
            In the event of a data breach that affects your personal information, CopyGen.in will notify affected users within 72 hours of becoming aware of the breach, in compliance with applicable data protection regulations. Notification will be sent to the email address associated with your account.
          </p>

          <h2 className="text-2xl font-display text-indigo-400 mt-12 mb-4">8. AI-Generated Content</h2>
          <p>
            CopyGen.in is an AI-assisted copywriting tool. While we strive for high-quality output, AI-generated content may occasionally contain inaccuracies, errors, or unintended similarities to existing content. You are solely responsible for reviewing, editing, and fact-checking all AI-generated copy before publication or distribution to your clients. CopyGen.in is not liable for any claims arising from published AI-generated content.
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
