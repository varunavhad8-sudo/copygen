import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import disposableDomains from 'disposable-email-domains';

// ── Inline validation helpers ────────────────────────────────────────────────
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePassword = (v) => v.length >= 8;
const validateName = (v) => v.trim().length >= 2;

const FieldError = ({ msg }) =>
  msg ? <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} />{msg}</p> : null;

export default function Signup() {
  const navigate = useNavigate();
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Capture ?ref= referral param on this page too (covers /signup?ref=... direct links)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('copygen_ref', ref);
  }, []);

  const validate = (fields = { agencyName, email, password }) => {
    const errs = {};
    if (!validateName(fields.agencyName)) errs.agencyName = 'Agency name must be at least 2 characters';
    
    if (!fields.email) errs.email = 'This field is required';
    else if (!validateEmail(fields.email)) errs.email = 'Please enter a valid email address';
    else {
      const domain = fields.email.split('@')[1];
      if (disposableDomains.includes(domain)) {
        errs.email = 'Please use a valid business email address';
      }
    }
    
    if (!fields.password) errs.password = 'This field is required';
    else if (!validatePassword(fields.password)) errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(validate());
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // Mark all fields as touched to show all errors
    setTouched({ agencyName: true, email: true, password: true });
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: agencyName });
      navigate('/app');
    } catch (err) {
      console.error('Signup error:', err);
      let msg = err.message.replace('Firebase: ', '');
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 8 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) => {
    const baseClass = "w-full bg-white border rounded-xl px-4 py-3 text-sm text-ink font-medium focus:outline-none transition-all";
    const stateClass = (touched[field] && fieldErrors[field])
      ? "border-red-400 focus:border-red-500"
      : "border-border focus:border-gold/50";
    return `${baseClass} ${stateClass}`;
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center font-sans px-4">
      <div className="premium-card p-8 sm:p-12 w-full max-w-md rounded-2xl">
        <div className="flex flex-col items-center mb-10">
          <h1 className="font-serif text-3xl tracking-tight mb-1">
            <span className="text-[#0E0E0C]">Copy</span><span className="text-gold">Gen</span>
          </h1>
          <p className="text-ink-muted text-xs uppercase tracking-widest font-bold">Join the agency of the future</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-[13px] mb-6 font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSignup} noValidate>
          {/* Agency Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Agency Name</label>
            <input
              id="signup-agency"
              type="text"
              placeholder="e.g. Skyline Marketing"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              onBlur={() => handleBlur('agencyName')}
              className={inputClass('agencyName')}
              disabled={loading}
              autoComplete="organization"
            />
            <FieldError msg={touched.agencyName && fieldErrors.agencyName} />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Email Address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@agency.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              className={inputClass('email')}
              disabled={loading}
              autoComplete="email"
            />
            <FieldError msg={touched.email && fieldErrors.email} />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Secure Password</label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`${inputClass('password')} pr-12`}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError msg={touched.password && fieldErrors.password} />
            {/* Password strength hint */}
            {password && !fieldErrors.password && (
              <p className="text-[11px] text-green-600 font-bold mt-1">✓ Password looks good</p>
            )}
          </div>

          <button
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-ink text-ivory rounded-xl font-bold text-sm hover:bg-ink/90 transition-all shadow-lg shadow-ink/10 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>
          
          <p className="text-[10px] text-ink-muted text-center mt-4 leading-relaxed px-4">
            By creating an account, you agree to our{' '}
            <a href="/terms" target="_blank" className="text-gold font-bold hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-gold font-bold hover:underline">Privacy Policy</a>.
          </p>
        </form>

        <div className="mt-8 pt-8 border-t border-border flex flex-col items-center gap-4">
          <p className="text-xs text-ink-muted">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="ml-1 text-gold font-bold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
