import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Validate required env vars and warn clearly in the console
const REQUIRED_VARS = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(REQUIRED_VARS)
  .filter(([, v]) => !v)
  .map(([k]) => `VITE_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

export const firebaseConfigured = missing.length === 0;

if (!firebaseConfigured) {
  console.error(
    `%c[Firebase] ❌ Missing configuration%c\nFill in your VITE_FIREBASE_* values in the .env file:\n${missing.join('\n')}\n\nGet them from:\nhttps://console.firebase.google.com → Your project → Project Settings → Your web app → Config`,
    'color: #ff3366; font-weight: bold;',
    'color: #ffcc00;'
  );
}

// Only initialize if we have a real apiKey — avoids auth/invalid-api-key crash
let auth = null;
let googleProvider = null;
let app = null;

if (firebaseConfigured) {
  app = initializeApp(REQUIRED_VARS);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export { auth, googleProvider };
export default app;



