import { withAuth } from '../../../middleware/adminAuth';
import { createRateLimitMiddleware } from '../../../utils/rateLimiter';
import { logAdminAction, AUDIT_EVENTS } from '../../../utils/auditLog';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ROLES } from '../../../utils/roleUtils';

const rateLimitMiddleware = createRateLimitMiddleware({
  type: 'admin',
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => req.user?.email || req.ip
});

const handler = async (req, res) => {
  if (req.method !== 'PUT') {
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
    const { email, newRole } = req.body;

    // Validation
    if (!email || !newRole) {
      return res.status(400).json({ 
        error: 'Email and newRole are required',
        code: 'MISSING_REQUIRED_FIELDS' 
      });
    }

    if (!Object.values(ROLES).includes(newRole)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        code: 'INVALID_ROLE',
        validRoles: Object.values(ROLES)
      });
    }

    // Prevent self-role change
    if (email === req.user.email) {
      return res.status(400).json({ 
        error: 'Cannot change your own role',
        code: 'SELF_ROLE_CHANGE_FORBIDDEN' 
      });
    }

    // Check if admin exists
    const adminRef = doc(db, 'admins', email);
    const adminSnap = await getDoc(adminRef);
    
    if (!adminSnap.exists()) {
      return res.status(404).json({ 
        error: 'Admin not found',
        code: 'ADMIN_NOT_FOUND' 
      });
    }

    const currentData = adminSnap.data();
    const oldRole = currentData.role;

    // Update role
    await setDoc(adminRef, {
      ...currentData,
      role: newRole,
      roleUpdatedBy: req.user.email,
      roleUpdatedAt: new Date().toISOString()
    }, { merge: true });

    // Log the action
    await logAdminAction(
      req.user.email,
      req.user.role,
      AUDIT_EVENTS.ADMIN_ROLE_CHANGED,
      email,
      {
        oldRole,
        newRole,
        userAgent: req.headers['user-agent'],
        actorIP: req.ip
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: { email, oldRole, newRole }
    });

  } catch (error) {
    console.error('Update role error:', error);
    
    await logAdminAction(
      req.user.email,
      req.user.role,
      AUDIT_EVENTS.SYSTEM_ERROR,
      req.body.email,
      {
        error: error.message,
        action: 'update_role_failed'
      }
    );

    return res.status(500).json({ 
      error: 'Failed to update role',
      code: 'INTERNAL_ERROR' 
    });
  }
};

export default withAuth(handler, 'admin');