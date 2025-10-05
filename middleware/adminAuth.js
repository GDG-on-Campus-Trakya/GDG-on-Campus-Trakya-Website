import 'server-only';
import { checkUserRole, ROLES } from '../utils/roleUtils';
import { logger } from '../utils/logger';
import { adminRateLimit, isUserBlocked } from '../utils/rateLimiter';
import { getAuth, isFirebaseAdminAvailable } from '../utils/firebaseAdmin';

export const requireAuth = async (req, res, next) => {
  try {
    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable()) {
      logger.error('Firebase Admin not initialized');
      return res.status(500).json({
        error: 'Authentication service unavailable',
        code: 'AUTH_SERVICE_ERROR'
      });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_TOKEN' 
      });
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is blocked
    if (isUserBlocked(decodedToken.email)) {
      return res.status(429).json({ 
        error: 'You have been temporarily blocked',
        code: 'TEMPORARILY_BLOCKED'
      });
    }

    // Check rate limit
    const rateCheck = adminRateLimit(decodedToken.email);
    if (!rateCheck.allowed) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateCheck.retryAfter
      });
    }

    req.user = decodedToken;
    
    if (next) next();
    return decodedToken;
    
  } catch (error) {
    logger.error('Auth verification failed:', error);
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
    logger.error('Admin auth failed:', error);
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
    logger.error('Event Manager auth failed:', error);
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
    logger.error('Role auth failed:', error);
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
      logger.error('Middleware error:', error);
      return res.status(500).json({ 
        error: 'Server error',
        code: 'MIDDLEWARE_ERROR'
      });
    }
  };
};