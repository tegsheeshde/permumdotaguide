import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://permumdota-default-rtdb.asia-southeast1.firebasedatabase.app'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics may fail in Safari private mode, so wrap in try-catch
let analytics;
try {
  analytics = getAnalytics(app);
} catch (err) {
  console.warn('Firebase Analytics failed to initialize (likely Safari Private Mode):', err.message);
  analytics = null;
}

const db = getFirestore(app);
const rtdb = getDatabase(app);

// Debug logging
console.log('[Firebase] Initialized successfully');
console.log('[Firebase] Database URL:', firebaseConfig.databaseURL);
console.log('[Firebase] Project ID:', firebaseConfig.projectId);

export { app, analytics, db, rtdb };
