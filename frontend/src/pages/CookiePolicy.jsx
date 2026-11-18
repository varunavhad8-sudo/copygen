import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

const cookieTypes = [
  {
    name: 'Strictly Necessary Cookies',
    required: true,
    description: 'These cookies are essential for the website to function and cannot be disabled. They are set in response to actions you take such as logging in, setting privacy preferences, or completing forms.',
    examples: [
      { name: 'sb-auth-token', purpose: 'Stores your authentication session (Firebase)', duration: 'Session' },
      { name: 'copygen_session', purpose: 'Maintains your logged-in state', duration: '7 days' },
      { name: '__dodopayments_sid', purpose: 'Dodo Payments processing security', duration: '30 minutes' },
      { name: 'razorpay_*', purpose: 'Razorpay payment processing security', duration: 'Session' },
    ]
  },
  {
    name: 'Analytics & Performance Cookies',
    required: false,
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the platform.',
    examples: [
      { name: '_ga', purpose: 'Google Analytics — distinguishes users', duration: '2 years' },
      { name: '_ga_*', purpose: 'Google Analytics — persists session state', duration: '2 years' },
      { name: '_gid', purpose: 'Google Analytics — distinguishes users (short-term)', duration: '24 hours' },
    ]
  },
  {
    name: 'Functional / Preference Cookies',
    required: false,
    description: 'These cookies allow the website to remember choices you make and provide enhanced, more personal features.',
    examples: [
      { name: 'copygen_theme', purpose: 'Remembers your preferred UI theme (light/dark)', duration: '1 year' },
      { name: 'copygen_tour_seen', purpose: 'Tracks whether you have completed the onboarding tour', duration: '1 year' },
    ]
  }
];

export default function CookiePolicy() {
  useEffect(() => {
    document.title = "Cookie Policy | Copygen";
  }, []);

  return (
    <div className="bg-ivory text-ink font-sans selection:bg-gold selection:text-ivory">
      <LandingNavbar />
      <main className="pt-40 pb-24 px-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-border pb-16">
          <span className="text-gold font-bold text-[10px] uppercase tracking-widest mb-4 block">Legal</span>
          <h1 className="font-serif text-5xl md:text-6xl mb-6 text-ink">Cookie Policy</h1>
          <p className="text-ink-muted">Last updated: <strong>April 23, 2026</strong></p>
          <p className="text-ink-muted mt-4 max-w-2xl leading-relaxed">
            This Cookie Policy explains what cookies are, how Copygen uses them, and how you can manage your cookie preferences.
          </p>
        </div>

        <div className="space-y-16">

          <section id="what-are-cookies" className="scroll-mt-32">
            <h2 className="font-serif text-2xl md:text-3xl mb-6 text-ink">1. What Are Cookies?</h2>
            <div className="text-ink-muted leading-relaxed space-y-4">
              <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, provide functionality, and collect analytical information.</p>
              <p>Cookies can be "persistent" (remain on your device until you delete them or they expire) or "session" cookies (deleted when you close your browser). First-party cookies are set by Copygen; third-party cookies are set by our partners and service providers.</p>
            </div>
            <div className="mt-10 h-px bg-border/50" />
          </section>

          <section id="how-we-use" className="scroll-mt-32">
            <h2 className="font-serif text-2xl md:text-3xl mb-6 text-ink">2. How Copygen Uses Cookies</h2>
            <div className="text-ink-muted leading-relaxed space-y-4">
              <p>We use cookies and similar technologies (such as local storage and session storage) for the following purposes:</p>
              <ul className="ml-4 space-y-2">
                <li className="list-disc"><strong className="text-ink">Authentication:</strong> To keep you logged in and protect your account</li>
                <li className="list-disc"><strong className="text-ink">Security:</strong> To detect and prevent fraudulent activity and secure payment sessions</li>
                <li className="list-disc"><strong className="text-ink">Analytics:</strong> To understand how users navigate our platform so we can improve it</li>
                <li className="list-disc"><strong className="text-ink">Preferences:</strong> To remember your settings across visits</li>
              </ul>
            </div>
            <div className="mt-10 h-px bg-border/50" />
          </section>

          <section id="cookie-table" className="scroll-mt-32">
            <h2 className="font-serif text-2xl md:text-3xl mb-6 text-ink">3. Cookies We Use</h2>
            <div className="space-y-10">
              <div className="p-6 rounded-2xl border border-border bg-white">
                <h3 className="font-bold text-ink text-lg mb-4">Proper Cookie Listing</h3>
                <ul className="ml-4 space-y-2">
                  <li className="list-disc"><strong className="text-ink">Authentication cookies:</strong> sb-auth-token, Firebase session</li>
                  <li className="list-disc"><strong className="text-ink">Analytics cookies:</strong> Google Analytics _ga, _gid</li>
                  <li className="list-disc"><strong className="text-ink">Functional cookies:</strong> copygen_theme, copygen_tour_seen</li>
                  <li className="list-disc"><strong className="text-ink">Payment security cookies:</strong> Dodo Payments</li>
                </ul>
              </div>
            </div>
            <div className="mt-10 h-px bg-border/50" />
          </section>

          <section id="manage" className="scroll-mt-32">
            <h2 className="font-serif text-2xl md:text-3xl mb-6 text-ink">4. Managing Your Cookie Preferences</h2>
            <div className="text-ink-muted leading-relaxed space-y-4">
              <p>You have several options to control or limit how we and our partners use cookies:</p>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gold-light/20 border border-gold/10">
                  <h3 className="font-bold text-ink mb-2">Browser Settings</h3>
                  <p className="text-sm">Most browsers allow you to manage cookies through their settings. You can set your browser to refuse cookies or delete specific cookies. Note that disabling certain cookies may affect the functionality of Copygen.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      ['Chrome', 'chrome://settings/cookies'],
                      ['Firefox', 'about:preferences#privacy'],
                      ['Safari', 'Safari → Preferences → Privacy'],
                      ['Edge', 'edge://settings/cookies']
                    ].map(([browser, path]) => (
                      <div key={browser} className="text-xs">
                        <strong className="text-ink">{browser}:</strong>{' '}
                        <span className="font-mono text-gold">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gold-light/20 border border-gold/10">
                  <h3 className="font-bold text-ink mb-2">Google Analytics Opt-Out</h3>
                  <p className="text-sm">You can opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on, available at tools.google.com/dlpage/gaoptout</p>
                </div>

                <div className="p-5 rounded-2xl bg-gold-light/20 border border-gold/10">
                  <h3 className="font-bold text-ink mb-2">Do Not Track</h3>
                  <p className="text-sm">Some browsers offer a "Do Not Track" (DNT) setting. When DNT is enabled, we limit analytics tracking to session-only data. Strictly necessary cookies remain active regardless of DNT settings.</p>
                </div>
              </div>
            </div>
            <div className="mt-10 h-px bg-border/50" />
          </section>

          <section id="changes" className="scroll-mt-32">
            <h2 className="font-serif text-2xl md:text-3xl mb-6 text-ink">5. Changes to This Policy</h2>
            <div className="text-ink-muted leading-relaxed">
              <p>We may update this Cookie Policy from time to time to reflect changes in technology, law, or our data practices. When we do, we will update the "Last Updated" date above. Material changes will be communicated via email or a notice on our website.</p>
            </div>
            <div className="mt-10 h-px bg-border/50" />
          </section>

          <section id="contact" className="scroll-mt-32">
            <h2 className="font-serif text-2xl md:text-3xl mb-6 text-ink">6. Contact Us</h2>
            <div className="text-ink-muted leading-relaxed">
              <p>For questions about this Cookie Policy or to exercise your data rights:</p>
              <p className="mt-4">
                <strong className="text-ink">Email:</strong> privacy@copygen.in<br />
                <strong className="text-ink">Website:</strong> https://copygen.in
              </p>
            </div>
          </section>

        </div>

        {/* Footer Note */}
        <div className="mt-16 p-8 bg-ink text-ivory rounded-3xl">
          <p className="font-serif text-xl mb-4">Questions about cookies?</p>
          <p className="text-ivory/60 text-sm mb-6">We're happy to explain what data we collect and why.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:privacy@copygen.in"
              className="px-6 py-3 bg-gold text-ink rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors text-center"
            >
              Email Privacy Team
            </a>
            <Link
              to="/privacy"
              className="px-6 py-3 border border-white/20 text-ivory rounded-xl text-sm font-bold hover:bg-white/5 transition-colors text-center"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
