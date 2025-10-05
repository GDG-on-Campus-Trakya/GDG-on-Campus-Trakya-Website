import 'server-only';
import { NextResponse } from 'next/server';
import { verifyIdToken } from '../utils/firebaseAdmin';
import { checkUserRoleServer, ROLES } from '../utils/roleUtilsServer';
import { logger } from '../utils/logger';
import { adminRateLimit, isUserBlocked } from '../utils/rateLimiter';

export const requireAuth = async (request) => {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const decodedToken = await verifyIdToken(token);

    // Check if user is blocked
    if (isUserBlocked(decodedToken.email)) {
      return NextResponse.json(
        { error: 'You have been temporarily blocked', code: 'TEMPORARILY_BLOCKED' },
        { status: 429 }
      );
    }

    // Check rate limit
    const rateCheck = adminRateLimit(decodedToken.email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.', 
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateCheck.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateCheck.retryAfter.toString()
          }
        }
      );
    }

    return { user: decodedToken };

  } catch (error) {
    logger.error('Auth verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
      { status: 401 }
    );
  }
};

export const requireAdmin = async (request) => {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const role = await checkUserRoleServer(authResult.user.email);

    if (role !== ROLES.ADMIN) {
      return NextResponse.json(
        {
          error: 'Admin privileges required',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'admin',
          userRole: role
        },
        { status: 403 }
      );
    }

    return { user: { ...authResult.user, role } };

  } catch (error) {
    logger.error('Admin auth failed:', error);
    return NextResponse.json(
      { error: 'Authentication service error', code: 'AUTH_SERVICE_ERROR' },
      { status: 500 }
    );
  }
};

export const requireEventManager = async (request) => {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const role = await checkUserRoleServer(authResult.user.email);

    if (role !== ROLES.EVENT_MANAGER && role !== ROLES.ADMIN) {
      return NextResponse.json(
        {
          error: 'Event Manager or Admin privileges required',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'event_manager',
          userRole: role
        },
        { status: 403 }
      );
    }

    return { user: { ...authResult.user, role } };

  } catch (error) {
    logger.error('Event Manager auth failed:', error);
    return NextResponse.json(
      { error: 'Authentication service error', code: 'AUTH_SERVICE_ERROR' },
      { status: 500 }
    );
  }
};

export const requireAdminOrEventManager = async (request) => {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const role = await checkUserRoleServer(authResult.user.email);

    if (!role || (role !== ROLES.ADMIN && role !== ROLES.EVENT_MANAGER)) {
      return NextResponse.json(
        {
          error: 'Admin or Event Manager privileges required',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'admin_or_event_manager',
          userRole: role
        },
        { status: 403 }
      );
    }

    return { user: { ...authResult.user, role } };

  } catch (error) {
    logger.error('Role auth failed:', error);
    return NextResponse.json(
      { error: 'Authentication service error', code: 'AUTH_SERVICE_ERROR' },
      { status: 500 }
    );
  }
};

// Wrapper function for API routes
export const withAuth = (handler, authType = 'auth') => {
  return async (request) => {
    try {
      let authResult;

      switch (authType) {
        case 'admin':
          authResult = await requireAdmin(request);
          break;
        case 'eventManager':
          authResult = await requireEventManager(request);
          break;
        case 'adminOrEventManager':
          authResult = await requireAdminOrEventManager(request);
          break;
        default:
          authResult = await requireAuth(request);
      }

      // If authResult is a NextResponse (error), return it
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      // Add user info to request context and call handler
      return await handler(request, authResult.user);

    } catch (error) {
      logger.error('Middleware error:', error);
      return NextResponse.json(
        { error: 'Server error', code: 'MIDDLEWARE_ERROR' },
        { status: 500 }
      );
    }
  };
};