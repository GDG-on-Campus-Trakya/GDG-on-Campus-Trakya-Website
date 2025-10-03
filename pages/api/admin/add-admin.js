import { withAuth } from '../../../middleware/adminAuth';
import { createRateLimitMiddleware } from '../../../utils/rateLimiter';
import { logAdminAction, AUDIT_EVENTS } from '../../../utils/auditLog';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ROLES } from '../../../utils/roleUtils';
import { logger } from '../../../utils/logger';

// Rate limiting middleware
const rateLimitMiddleware = createRateLimitMiddleware({
  type: 'admin',
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req) => req.user?.email || req.ip
});

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED' 
    });
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    rateLimitMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    const { email, role = ROLES.EVENT_MANAGER } = req.body;

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        error: 'Valid email is required',
        code: 'INVALID_EMAIL' 
      });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        code: 'INVALID_ROLE',
        validRoles: Object.values(ROLES)
      });
    }

    // Check if already admin
    const existingAdminRef = doc(db, 'admins', email);
    const existingAdmin = await getDoc(existingAdminRef);
    
    if (existingAdmin.exists()) {
      return res.status(409).json({ 
        error: 'User is already an admin',
        code: 'ALREADY_ADMIN' 
      });
    }

    // Add admin
    await setDoc(doc(db, 'admins', email), {
      email,
      role,
      addedBy: req.user.email,
      addedAt: new Date().toISOString(),
      active: true
    });

    // Log the action
    await logAdminAction(
      req.user.email,
      req.user.role,
      AUDIT_EVENTS.ADMIN_ADDED,
      email,
      {
        newRole: role,
        userAgent: req.headers['user-agent'],
        actorIP: req.ip
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Admin added successfully',
      data: { email, role }
    });

  } catch (error) {
    logger.error('Add admin error:', error);
    
    await logAdminAction(
      req.user.email,
      req.user.role,
      AUDIT_EVENTS.SYSTEM_ERROR,
      req.body.email,
      {
        error: error.message,
        action: 'add_admin_failed'
      }
    );

    return res.status(500).json({ 
      error: 'Failed to add admin',
      code: 'INTERNAL_ERROR' 
    });
  }
};

export default withAuth(handler, 'admin');