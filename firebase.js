// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
};

// Override authDomain only for development
const env = process.env.NODE_ENV;
if (env === "development") {
  firebaseConfig.authDomain = "localhost:3000";
}
// In production, keep the original Firebase authDomain for redirect authentication to work

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// Set auth persistence for better Safari performance
// IndexedDB is preferred, falls back to localStorage
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence)
    .catch((error) => {
      // If IndexedDB fails (some Safari private mode), try localStorage
      console.warn('IndexedDB persistence failed, falling back to localStorage:', error);
      return setPersistence(auth, browserLocalPersistence);
    })
    .catch((error) => {
      console.error('Auth persistence setup failed:', error);
    });

  // Safari-specific: Monitor Firebase Realtime DB connection state
  import('firebase/database').then(({ ref, onValue }) => {
    const connectedRef = ref(realtimeDb, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        console.warn('Firebase Realtime DB disconnected');
      } else if (process.env.NODE_ENV === 'development') {
        console.log('Firebase Realtime DB connected');
      }
    });
  });

  // Safari-specific: Handle page visibility changes for better connection management
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page hidden - Safari may throttle connections
      if (process.env.NODE_ENV === 'development') {
        console.log('Page hidden - Safari may throttle Firebase connection');
      }
    } else {
      // Page visible - ensure connection is active
      if (process.env.NODE_ENV === 'development') {
        console.log('Page visible - Firebase connection should resume');
      }
    }
  });
}
