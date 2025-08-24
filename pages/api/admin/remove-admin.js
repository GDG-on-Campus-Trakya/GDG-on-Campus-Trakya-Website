import { withAuth } from '../../../middleware/adminAuth';
import { createRateLimitMiddleware } from '../../../utils/rateLimiter';
import { logAdminAction, AUDIT_EVENTS } from '../../../utils/auditLog';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

const rateLimitMiddleware = createRateLimitMiddleware({
  type: 'admin',
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => req.user?.email || req.ip
});

const handler = async (req, res) => {
  if (req.method !== 'DELETE') {
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
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        code: 'EMAIL_REQUIRED' 
      });
    }

    // Prevent self-removal
    if (email === req.user.email) {
      return res.status(400).json({ 
        error: 'Cannot remove yourself',
        code: 'SELF_REMOVAL_FORBIDDEN' 
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

    const adminData = adminSnap.data();

    // Remove admin
    await deleteDoc(adminRef);

    // Log the action
    await logAdminAction(
      req.user.email,
      req.user.role,
      AUDIT_EVENTS.ADMIN_REMOVED,
      email,
      {
        removedRole: adminData.role,
        userAgent: req.headers['user-agent'],
        actorIP: req.ip
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin removed successfully',
      data: { email, previousRole: adminData.role }
    });

  } catch (error) {
    console.error('Remove admin error:', error);
    
    await logAdminAction(
      req.user.email,
      req.user.role,
      AUDIT_EVENTS.SYSTEM_ERROR,
      req.body.email,
      {
        error: error.message,
        action: 'remove_admin_failed'
      }
    );

    return res.status(500).json({ 
      error: 'Failed to remove admin',
      code: 'INTERNAL_ERROR' 
    });
  }
};

export default withAuth(handler, 'admin');