import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { isWorkEmail } from '../utils/authValidation';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePassword = (v) => v.length >= 8;

const FieldError = ({ msg }) =>
  msg ? <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} />{msg}</p> : null;

export default function Login() {
  const navigate = useNavigate();
  const { user, authError } = useAuth();
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Password Reset State
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const validate = (fields = { email, password }) => {
    const errs = {};
    if (!fields.email) errs.email = 'This field is required';
    else if (!validateEmail(fields.email)) errs.email = 'Please enter a valid email address';

    if (!fields.password) errs.password = 'This field is required';
    else if (!validatePassword(fields.password)) errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(validate());
  };

  // SEO: Update Meta Description & Redirect if logged in
  useEffect(() => {
    // Capture ?ref= referral param on this page too (covers /login?ref=shakira links)
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('copygen_ref', ref);

    if (user) {
      navigate('/app');
    }
    document.title = "Login | Copygen - Agency Marketing Operating System";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Sign in to Copygen, the unified Marketing Operating System for agencies. Automate brand voice consistency, brief generation, and strategic content creation.');
    }
  }, [user, navigate]);

  const handleGoogle = async () => {
    if (!auth || !googleProvider) {
      setError('Firebase is not configured. Fill in VITE_FIREBASE_* values in your .env file.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/app');
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setError(err.message.replace('Firebase: ', '') || 'Google sign in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!auth) {
      setError('Firebase is not configured. Fill in VITE_FIREBASE_* values in your .env file.');
      return;
    }

    setTouched({ email: true, password: true });
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/app');
    } catch (err) {
      console.error('Email Auth Error:', err);
      let msg = err.message.replace('Firebase: ', '');
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (msg.includes('auth/invalid-credential')) {
        msg = 'Invalid email or password.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      console.error('Password Reset Error:', err);
      setResetError(err.message.replace('Firebase: ', ''));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex font-sans overflow-hidden">
      {/* LEFT SIDE: AUTH FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative bg-white">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(#B8975A_1px,transparent_1px)] [background-size:30px_30px]" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          <div className="flex flex-col mb-12">
            <h1 className="font-serif text-3xl tracking-tight mb-1">
              <span className="text-[#0E0E0C]">Copy</span><span className="text-gold">gen</span>
            </h1>
            <p className="text-gold text-[10px] uppercase font-black tracking-[0.3em]">Unified Marketing OS</p>
          </div>

          <div className="mb-10">
            {(error || authError) && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-xs mb-6 font-bold flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {authError || error}
              </div>
            )}
            <h2 className="text-2xl font-serif text-ink mb-2">
              {mode === 'email' ? (isSignup ? 'Create account' : 'Welcome back') : 'Get started'}
            </h2>
            <p className="text-ink-muted text-sm font-medium">Enter your credentials to access your marketing workspace.</p>
          </div>

          {mode !== 'email' ? (
            <div className="space-y-4">
              <button 
                onClick={handleGoogle} 
                disabled={loading}
                className="w-full py-4 border border-border text-ink rounded-xl font-bold text-sm hover:bg-gold-light/20 transition-all flex items-center justify-center gap-3 group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google icon" />
                {loading ? 'Authenticating...' : 'Continue with Google'}
              </button>
              
              <button 
                onClick={() => setMode('email')}
                className="w-full py-4 bg-ink text-ivory rounded-xl font-bold text-sm hover:bg-ink/90 transition-all shadow-lg active:scale-[0.98]"
              >
                Continue with Email
              </button>

              <p className="text-[11px] text-ink-muted text-center pt-4 italic">
                By continuing, you agree to Copygen's <span className="underline cursor-pointer">Terms of Service</span>.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleEmail(); }}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Work Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@agency.com" 
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (touched.email) setFieldErrors(validate({ email: e.target.value, password }));
                  }}
                  onBlur={() => handleBlur('email')}
                  className={`w-full bg-ivory/30 border rounded-xl px-4 py-3 text-sm text-ink font-medium focus:outline-none transition-all ${
                    touched.email && fieldErrors.email ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-gold'
                  }`}
                  required
                />
                <FieldError msg={touched.email && fieldErrors.email} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Secure Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (touched.password) setFieldErrors(validate({ email, password: e.target.value }));
                  }}
                  onBlur={() => handleBlur('password')}
                  className={`w-full bg-ivory/30 border rounded-xl px-4 py-3 text-sm text-ink font-medium focus:outline-none transition-all ${
                    touched.password && fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-gold'
                  }`}
                  required
                />
                <FieldError msg={touched.password && fieldErrors.password} />
              </div>

              <button 
                disabled={loading}
                className="w-full py-4 bg-gold text-ink rounded-xl font-bold text-sm hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? 'Processing...' : (isSignup ? 'Create Agency Account' : 'Sign In to Workspace')}
              </button>

              <div className="pt-6 flex flex-col items-center gap-4 border-t border-border mt-4">
                <p 
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-xs text-ink-muted font-bold cursor-pointer hover:text-gold transition-colors flex items-center gap-1"
                >
                  {isSignup ? 'Already have an account?' : "New to Copygen?"} 
                  <span className="text-gold underline">{isSignup ? 'Sign in' : 'Get 10 Free Generations'}</span>
                </p>
                
                <button 
                  type="button"
                  onClick={() => setMode(null)}
                  className="text-[10px] text-ink-muted uppercase tracking-widest font-black hover:text-ink transition-colors"
                >
                  ← Other login methods
                </button>

                {!isSignup && (
                  <div className="w-full pt-4 border-t border-border mt-4 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReset(!showReset);
                        setResetError('');
                        setResetSent(false);
                      }}
                      className="text-[10px] text-ink-muted uppercase tracking-widest font-black hover:text-gold transition-colors"
                    >
                      {showReset ? 'Cancel reset' : 'Forgot Password?'}
                    </button>

                    {showReset && (
                      <div className="w-full mt-4 p-4 bg-ivory/50 rounded-xl border border-border animate-in fade-in slide-in-from-top-2 duration-300">
                        {resetSent ? (
                          <div className="text-center space-y-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-green-600 text-sm">✓</span>
                            </div>
                            <p className="text-xs font-bold text-ink">Check your inbox</p>
                            <p className="text-[10px] text-ink-muted leading-relaxed">
                              If an account exists for {resetEmail}, you'll receive a link to reset your password shortly.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest">Recovery Email</label>
                              <input 
                                type="email" 
                                placeholder="name@agency.com" 
                                value={resetEmail}
                                onChange={e => setResetEmail(e.target.value)}
                                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-ink font-medium focus:outline-none focus:border-gold transition-all"
                              />
                            </div>
                            {resetError && (
                              <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                <AlertCircle size={10} /> {resetError}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={handleResetPassword}
                              disabled={resetLoading}
                              className="w-full py-2.5 bg-ink text-ivory rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-ink/90 transition-all disabled:opacity-50"
                            >
                              {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: BRANDING & SEO TEXT */}
      <div className="hidden lg:flex w-1/2 bg-ink relative items-center justify-center p-16 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] ease-linear hover:scale-110"
          style={{ backgroundImage: 'url(/branding_bg.png)' }}
        />
        <div className="absolute inset-0 bg-ink/80 backdrop-blur-[2px]" />
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-gold/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-gold/5 blur-[120px] rounded-full animate-blob" />

        <div className="relative z-10 w-full max-w-lg">
          <header className="mb-12">
            <span className="inline-block px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              Empowering Next-Gen Agencies
            </span>
            <h2 className="font-serif text-5xl lg:text-6xl text-ivory leading-[1.1] tracking-tight mb-8">
              The AI Operating System for <span className="text-gold italic underline decoration-gold/30">Modern Marketing.</span>
            </h2>
          </header>

          <article className="space-y-8">
            <p className="text-ivory/70 text-lg leading-relaxed font-light">
              Copygen unifies your agency's creative workflow into a single, high-performance platform. 
              From deep brand voice intelligence to automated content generation, we help you scale without losing the human touch.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-ivory/10">
              <div className="space-y-2">
                <h4 className="text-gold font-serif text-xl">Consistency</h4>
                <p className="text-ivory/40 text-[11px] uppercase tracking-wider font-bold">100% Brand-Aligned Outputs</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-gold font-serif text-xl">Velocity</h4>
                <p className="text-ivory/40 text-[11px] uppercase tracking-wider font-bold">10x Brief Generation Speed</p>
              </div>
            </div>
          </article>
          
          {/* SEO Optimized Hidden Text (Optional, but included for context) */}
          <section className="sr-only">
            <h3>AI Marketing Agency Operating System</h3>
            <p>Optimize your marketing agency with automated brand voice consistency, AI brief generation, and strategic content creation. Built for professional agencies and brand managers.</p>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}




