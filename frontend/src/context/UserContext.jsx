import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase'; // Adjusted path
import { userAPI } from '../utils/api';

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);       // Full user object from backend
  const [loading, setLoading] = useState(true);  // True while fetching
  const [error, setError] = useState(null);

  useEffect(() => {
    if (LOCAL_MODE) {
      setUser({ name: 'Local User', email: 'local@copygen.local', plan: 'free', generationsLimit: 999999, generationsUsed: 0 });
      setLoading(false);
      return () => {};
    }

    // Listen to Firebase auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await userAPI.getProfile();
          setUser(profile.user || profile);
          setError(null);
        } catch (err) {
          console.error('[UserContext] Failed to fetch profile:', err);
          setError(err.message);
        }
      } else {
        setUser(null);
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    try {
      const profile = await userAPI.getProfile();
      setUser(profile.user || profile);
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
};
