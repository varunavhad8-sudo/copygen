import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authAPI } from '../utils/api';

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const hadUserRef = useRef(false);

  const updateUser = useCallback((newUser) => {
    if (newUser) hadUserRef.current = true;
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try { await signOut(auth); } catch (_) {}
    setUser(null);
  }, []);

  useEffect(() => {
    if (LOCAL_MODE) {
      updateUser({ name: 'Local User', email: 'local@copygen.local', uid: 'local-user', plan: 'free', generationsLimit: 999999, generationsUsed: 0 });
      setLoading(false);
      return () => {};
    }

    let unsubscribe = () => {};

    // Safety timeout: if Firebase never fires (e.g. empty env vars), stop spinner
    const fallbackTimer = setTimeout(() => {
      console.warn('[AuthContext] Firebase onAuthStateChanged never fired. Check VITE_FIREBASE_* env vars.');
      setLoading(false);
    }, 5000);

    if (!auth) {
      console.error('[AuthContext] Firebase auth is null — check VITE_FIREBASE_* env vars in .env');
      clearTimeout(fallbackTimer);
      setLoading(false);
      return () => clearTimeout(fallbackTimer);
    }

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(fallbackTimer);

        if (firebaseUser) {
          // ── Session is active ───────────────────────────────────────────────
          setSessionExpired(false);

          // FIX: Set user from Firebase data IMMEDIATELY so ProtectedRoute never
          // sees user=null while loading=false during backend cold start.
          // This prevents the /login redirect race condition on Render.
          updateUser({
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            uid: firebaseUser.uid,
            isFallback: true
          });
          setLoading(false);

          try {
            const token = await firebaseUser.getIdToken(false);
            const referredBy = localStorage.getItem('copygen_ref') || undefined;
            const backendUser = await authAPI.register({ token, ...(referredBy && { referredBy }) });
            console.log('[AuthContext] Backend sync successful:', backendUser.email);
            // Clear referral code after successful sync — only needs to be sent once
            if (referredBy) localStorage.removeItem('copygen_ref');
            updateUser(backendUser);
            setAuthError(null);
          } catch (error) {
            console.error('[AuthContext] Auth sync failed:', error.message);
            setAuthError(error.response?.data?.message || error.message);
            // user is already set to Firebase fallback above — no action needed
          }
        } else {
          // ── Session has ended (logout or expiry) ────────────────────────────
          const hadUser = hadUserRef.current;
          setUser(null);
          if (hadUser) setSessionExpired(true);
          setLoading(false);
        }
      });
    } catch (firebaseError) {
      console.error('[AuthContext] Firebase init error:', firebaseError);
      clearTimeout(fallbackTimer);
      setLoading(false);
    }

    return () => { clearTimeout(fallbackTimer); unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, authError, setUser: updateUser, logout, sessionExpired, setSessionExpired
    }}>
      {loading ? (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#050508',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px',
          zIndex: 9999,
        }}>
          <div style={{
            width: '36px', height: '36px',
            border: '3px solid #1e1e2e',
            borderTop: '3px solid #c9a84c',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(209,209,224,0.4)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Loading…
          </p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
