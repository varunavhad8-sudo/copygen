const admin = require('firebase-admin');

// Guard: skip init if already initialized (e.g. nodemon hot reload)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Firebase Admin initialization failed:', err.message);
  }
}

module.exports = admin;



