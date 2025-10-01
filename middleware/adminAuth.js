import 'server-only';
import admin from 'firebase-admin';
import { checkUserRole, ROLES } from '../utils/roleUtils';

// Initialize Firebase Admin with secure credentials
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) return true;

  try {
    let credential;
    
    if (process.env.NODE_ENV === 'production') {
      // Production: Use service account JSON
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = admin.credential.cert(serviceAccount);
      } else {
        // Vercel/Netlify: Use individual env vars
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        });
      }
    } else {
      // Development: Use default credentials or emulator
      if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        // Emulator mode - no credentials needed
        credential = admin.credential.applicationDefault();
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Development with service account file
        credential = admin.credential.applicationDefault();
      } else {
        console.warn('⚠️ Firebase Admin not initialized - missing credentials');
        return false;
      }
    }
    
    admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    return true;
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    return false;
  }
};

// Initialize on module load
initializeFirebaseAdmin();

// Rate limiting için basit in-memory store
const attempts = new Map();

const rateLimit = (email, maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const userAttempts = attempts.get(email) || { count: 0, resetTime: now + windowMs };
  
  if (now > userAttempts.resetTime) {
    userAttempts.count = 0;
    userAttempts.resetTime = now + windowMs;
  }
  
  userAttempts.count++;
  attempts.set(email, userAttempts);
  
  return userAttempts.count <= maxAttempts;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_TOKEN' 
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!rateLimit(decodedToken.email)) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    req.user = decodedToken;
    
    if (next) next();
    return decodedToken;
    
  } catch (error) {
    console.error('Auth verification failed:', error);
    return res.status(401).json({ 
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN' 
    });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, async () => {
      const role = await checkUserRole(req.user.email);
      
      if (role !== ROLES.ADMIN) {
        return res.status(403).json({ 
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'admin',
          userRole: role
        });
      }
      
      req.user.role = role;
      
      if (next) next();
    });
  } catch (error) {
    console.error('Admin auth failed:', error);
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

export const requireEventManager = async (req, res, next) => {
  try {
    await requireAuth(req, res, async () => {
      const role = await checkUserRole(req.user.email);
      
      if (role !== ROLES.EVENT_MANAGER && role !== ROLES.ADMIN) {
        return res.status(403).json({ 
          error: 'Event Manager or Admin privileges required',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'event_manager',
          userRole: role
        });
      }
      
      req.user.role = role;
      
      if (next) next();
    });
  } catch (error) {
    console.error('Event Manager auth failed:', error);
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

export const requireAdminOrEventManager = async (req, res, next) => {
  try {
    await requireAuth(req, res, async () => {
      const role = await checkUserRole(req.user.email);
      
      if (!role || (role !== ROLES.ADMIN && role !== ROLES.EVENT_MANAGER)) {
        return res.status(403).json({ 
          error: 'Admin or Event Manager privileges required',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'admin_or_event_manager',
          userRole: role
        });
      }
      
      req.user.role = role;
      
      if (next) next();
    });
  } catch (error) {
    console.error('Role auth failed:', error);
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Wrapper function for API routes
export const withAuth = (handler, authType = 'auth') => {
  return async (req, res) => {
    try {
      let authMiddleware;
      
      switch (authType) {
        case 'admin':
          authMiddleware = requireAdmin;
          break;
        case 'eventManager':
          authMiddleware = requireEventManager;
          break;
        case 'adminOrEventManager':
          authMiddleware = requireAdminOrEventManager;
          break;
        default:
          authMiddleware = requireAuth;
      }
      
      await authMiddleware(req, res, async () => {
        return await handler(req, res);
      });
      
    } catch (error) {
      console.error('Middleware error:', error);
      return res.status(500).json({ 
        error: 'Server error',
        code: 'MIDDLEWARE_ERROR'
      });
    }
  };
};