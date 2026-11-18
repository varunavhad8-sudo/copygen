import { useState, useEffect } from 'react';

const CONSENT_KEY = 'copygen_cookie_consent';
const GA_ID = import.meta.env.VITE_GA_ID || ''; // Set VITE_GA_ID in .env when you have a GA4 Measurement ID

/**
 * Injects the Google Analytics script into the DOM.
 * Called ONLY after the user explicitly clicks Accept.
 * Never called if the user declines or has previously declined.
 */
const loadGoogleAnalytics = (measurementId) => {
  if (!measurementId) return; // No GA ID configured — skip silently
  if (document.getElementById('ga-script')) return; // Already loaded

  // gtag script tag
  const script1 = document.createElement('script');
  script1.id = 'ga-script';
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // gtag initialisation
  const script2 = document.createElement('script');
  script2.id = 'ga-init';
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', { anonymize_ip: true });
  `;
  document.head.appendChild(script2);

  console.log('[CookieConsent] Google Analytics loaded:', measurementId);
};

/**
 * CookieConsent Banner
 *
 * Behaviour:
 * - Shows on first visit if no consent decision is stored in localStorage
 * - Accept  → stores true  → injects GA immediately
 * - Decline → stores false → GA is NEVER loaded this session or any future session
 * - If consent was already given in a prior session, GA loads automatically on mount
 * - If consent was already declined, nothing loads and banner stays hidden
 */
const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);

    if (stored === null) {
      // First visit — show banner
      // Small delay so it doesn't flash during initial page load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }

    if (stored === 'true') {
      // Returning visitor who previously accepted
      loadGoogleAnalytics(GA_ID);
    }
    // stored === 'false' → do nothing, GA stays unloaded
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setVisible(false);
    loadGoogleAnalytics(GA_ID);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    setVisible(false);
    // Ensure no GA scripts were accidentally added before consent
    const gaScript = document.getElementById('ga-script');
    const gaInit = document.getElementById('ga-init');
    if (gaScript) gaScript.remove();
    if (gaInit) gaInit.remove();
  };

  if (!visible) return null;

  return (
    <div
      id="cookie-consent-banner"
      role="region"
      aria-label="Cookie consent"
      style={styles.banner}
    >
      <div style={styles.inner}>
        {/* Cookie icon */}
        <span style={styles.icon} aria-hidden="true">🍪</span>

        <div style={styles.text}>
          <span style={styles.bold}>We use cookies</span> for analytics and
          functionality. By continuing, you accept our{' '}
          <a href="/cookie-policy" style={styles.link}>Cookie Policy</a>.
        </div>

        <div style={styles.actions}>
          <button
            id="cookie-consent-decline"
            onClick={handleDecline}
            style={styles.declineBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            aria-label="Decline cookies"
          >
            Decline
          </button>
          <button
            id="cookie-consent-accept"
            onClick={handleAccept}
            style={styles.acceptBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#b8943f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#c9a84c'; }}
            aria-label="Accept cookies"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  banner: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 99998,
    width: 'calc(100% - 40px)',
    maxWidth: '780px',
    background: 'rgba(18, 18, 28, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: '14px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)',
    animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: '22px',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: '13.5px',
    color: 'rgba(209,209,224,0.7)',
    lineHeight: '1.5',
    minWidth: '200px',
  },
  bold: {
    fontWeight: '600',
    color: '#e8e8f0',
  },
  link: {
    color: '#c9a84c',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0,
  },
  declineBtn: {
    background: 'transparent',
    color: 'rgba(209,209,224,0.55)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    whiteSpace: 'nowrap',
  },
  acceptBtn: {
    background: '#c9a84c',
    color: '#050508',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    whiteSpace: 'nowrap',
  },
};

// Inject slide-up animation into the document once
if (typeof document !== 'undefined') {
  const styleId = 'cookie-consent-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(styleEl);
  }
}

export default CookieConsent;
