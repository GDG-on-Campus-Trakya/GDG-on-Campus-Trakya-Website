// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "", // Will be overridden below
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Override authDomain based on environment (Firebase best practice)
const env = process.env.NODE_ENV;
if (env === "development") {
  firebaseConfig.authDomain = "localhost:3000";
} else if (env === "production") {
  firebaseConfig.authDomain = "gdgoncampustu.com";
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Set auth persistence for mobile devices immediately
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Failed to set auth persistence:', error);
  });
}
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for better cross-device compatibility
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Force consent screen to ensure we get refresh tokens
  access_type: 'offline',
  // Better mobile compatibility
  include_granted_scopes: 'true'
});

// Add scope for basic profile info
googleProvider.addScope('profile');
googleProvider.addScope('email');


export const db = getFirestore(app);
export const storage = getStorage(app);
