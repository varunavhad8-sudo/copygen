import { Component } from 'react';

/**
 * Global Error Boundary
 * Catches any unhandled React render errors and shows a fallback UI
 * instead of a blank white screen.
 * Must be a class component — React hooks cannot implement componentDidCatch.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown error',
    };
  }

  componentDidCatch(error, info) {
    // Log to console for debugging — swap for a real error tracking service
    // (e.g. Sentry) before production launch
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info?.componentStack);
  }

  handleRefresh() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          {/* Logo / Brand mark */}
          <div style={styles.logoWrapper}>
            <span style={styles.logoText}>CopyGen</span>
          </div>

          {/* Icon */}
          <div style={styles.iconWrapper}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 style={styles.heading}>Something went wrong</h1>
          <p style={styles.body}>
            An unexpected error occurred. Please refresh the page to continue.
            If the problem persists, contact us at{' '}
            <a href="mailto:support@copygen.in" style={styles.link}>
              support@copygen.in
            </a>
          </p>

          <button
            id="error-boundary-refresh-btn"
            onClick={this.handleRefresh}
            style={styles.button}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#b8943f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#c9a84c'; }}
          >
            Refresh Page
          </button>

          {/* Dev-only error detail */}
          {import.meta.env.DEV && this.state.errorMessage && (
            <details style={styles.details}>
              <summary style={styles.summary}>Error details (dev only)</summary>
              <pre style={styles.pre}>{this.state.errorMessage}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

const styles = {
  wrapper: {
    position: 'fixed',
    inset: 0,
    background: '#050508',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 99999,
    fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: '16px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 0 60px rgba(201,168,76,0.06)',
  },
  logoWrapper: {
    marginBottom: '24px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #c9a84c, #f0d080)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  iconWrapper: {
    marginBottom: '20px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#e8e8f0',
    margin: '0 0 12px 0',
    letterSpacing: '-0.3px',
  },
  body: {
    fontSize: '14px',
    color: 'rgba(209,209,224,0.55)',
    lineHeight: '1.7',
    margin: '0 0 28px 0',
  },
  link: {
    color: '#c9a84c',
    textDecoration: 'none',
  },
  button: {
    background: '#c9a84c',
    color: '#050508',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    letterSpacing: '0.01em',
  },
  details: {
    marginTop: '24px',
    textAlign: 'left',
  },
  summary: {
    fontSize: '12px',
    color: 'rgba(209,209,224,0.3)',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  pre: {
    fontSize: '11px',
    color: '#f87171',
    background: 'rgba(248,113,113,0.07)',
    border: '1px solid rgba(248,113,113,0.15)',
    borderRadius: '6px',
    padding: '12px',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export default ErrorBoundary;
