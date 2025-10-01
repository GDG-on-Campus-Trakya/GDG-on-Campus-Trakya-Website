import 'server-only';
import admin from 'firebase-admin';

// Firebase Admin singleton
let firebaseAdmin = null;

const initializeFirebaseAdmin = () => {
  if (firebaseAdmin) return firebaseAdmin;
  
  try {
    if (admin.apps.length === 0) {
      let credential;
      
      if (process.env.NODE_ENV === 'production') {
        // Production deployment
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          // Method 1: Full JSON (Heroku, Railway, etc.)
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          credential = admin.credential.cert(serviceAccount);
        } else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
          // Method 2: Individual env vars (Vercel, Netlify)
          credential = admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          });
        } else {
          throw new Error('Missing Firebase Admin credentials');
        }
      } else {
        // Development
        if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
          // Emulator mode
          console.log('🔧 Using Firebase Emulator');
          credential = admin.credential.applicationDefault();
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          // Service account file
          console.log('🔧 Using service account file');
          credential = admin.credential.applicationDefault();
        } else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
          // Individual env vars (also support in development)
          console.log('🔧 Using individual environment variables');
          credential = admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          });
        } else {
          console.warn('⚠️ No Firebase Admin credentials found');
          console.warn('💡 For development, either:');
          console.warn('   1. Set GOOGLE_APPLICATION_CREDENTIALS to service account file path');
          console.warn('   2. Run Firebase emulators with FIREBASE_AUTH_EMULATOR_HOST');
          console.warn('   3. Set FIREBASE_ADMIN_PRIVATE_KEY environment variables');
          return null;
        }
      }
      
      firebaseAdmin = admin.initializeApp({
        credential,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      console.log('✅ Firebase Admin initialized');
    } else {
      firebaseAdmin = admin.apps[0];
    }
    
    return firebaseAdmin;
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('private_key')) {
      console.error('💡 Make sure FIREBASE_ADMIN_PRIVATE_KEY is properly escaped');
      console.error('   Example: "-----BEGIN PRIVATE KEY-----\\nYOUR_KEY\\n-----END PRIVATE KEY-----\\n"');
    }
    
    return null;
  }
};

// Lazy initialization
const getFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    firebaseAdmin = initializeFirebaseAdmin();
  }
  return firebaseAdmin;
};

// Helper functions
export const getAuth = () => {
  const app = getFirebaseAdmin();
  return app ? admin.auth(app) : null;
};

export const getFirestore = () => {
  const app = getFirebaseAdmin();
  return app ? admin.firestore(app) : null;
};

export const verifyIdToken = async (idToken) => {
  const auth = getAuth();
  if (!auth) {
    throw new Error('Firebase Admin not initialized');
  }
  return await auth.verifyIdToken(idToken);
};

export const isFirebaseAdminAvailable = () => {
  return getFirebaseAdmin() !== null;
};

export default getFirebaseAdmin;