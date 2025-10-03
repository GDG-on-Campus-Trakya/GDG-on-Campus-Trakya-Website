import { withAuth } from '../../../middleware/adminAuth';
import { createRateLimitMiddleware } from '../../../utils/rateLimiter';
import { logDataAccess, AUDIT_EVENTS } from '../../../utils/auditLog';
import { collection, query, orderBy, limit, where, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logger } from '../../../utils/logger';

const rateLimitMiddleware = createRateLimitMiddleware({
  type: 'api',
  maxAttempts: 20,
  windowMs: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (req) => req.user?.email || req.ip
});

const handler = async (req, res) => {
  if (req.method !== 'GET') {
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
    const { 
      page = 1, 
      pageSize = 50, 
      eventType, 
      actorEmail, 
      level,
      startDate,
      endDate,
      lastDocId 
    } = req.query;

    // Validation
    const pageSizeNum = Math.min(parseInt(pageSize), 100); // Max 100 items per page
    const pageNum = parseInt(page);

    if (pageSizeNum < 1 || pageNum < 1) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters',
        code: 'INVALID_PAGINATION' 
      });
    }

    // Build query
    let auditQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc')
    );

    // Add filters
    if (eventType) {
      auditQuery = query(auditQuery, where('eventType', '==', eventType));
    }

    if (actorEmail) {
      auditQuery = query(auditQuery, where('actorEmail', '==', actorEmail));
    }

    if (level) {
      auditQuery = query(auditQuery, where('level', '==', level));
    }

    if (startDate) {
      const startTimestamp = new Date(startDate);
      auditQuery = query(auditQuery, where('timestamp', '>=', startTimestamp));
    }

    if (endDate) {
      const endTimestamp = new Date(endDate);
      auditQuery = query(auditQuery, where('timestamp', '<=', endTimestamp));
    }

    // Handle pagination
    if (lastDocId) {
      const lastDoc = await getDoc(doc(db, 'audit_logs', lastDocId));
      if (lastDoc.exists()) {
        auditQuery = query(auditQuery, startAfter(lastDoc));
      }
    }

    // Limit results
    auditQuery = query(auditQuery, limit(pageSizeNum));

    // Execute query
    const querySnapshot = await getDocs(auditQuery);
    
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      });
    });

    // Log data access
    await logDataAccess(
      req.user.email,
      req.user.role,
      'audit_logs',
      'read',
      {
        filters: { eventType, actorEmail, level, startDate, endDate },
        resultCount: logs.length,
        userAgent: req.headers['user-agent'],
        actorIP: req.ip
      }
    );

    const hasMore = logs.length === pageSizeNum;
    const lastDoc = logs.length > 0 ? logs[logs.length - 1] : null;

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        hasMore,
        lastDocId: lastDoc?.id,
        totalReturned: logs.length
      },
      filters: {
        eventType,
        actorEmail,
        level,
        startDate,
        endDate
      }
    });

  } catch (error) {
    logger.error('Get audit logs error:', error);
    
    await logDataAccess(
      req.user.email,
      req.user.role,
      'audit_logs',
      'read_failed',
      {
        error: error.message,
        userAgent: req.headers['user-agent'],
        actorIP: req.ip
      }
    );

    return res.status(500).json({ 
      error: 'Failed to fetch audit logs',
      code: 'INTERNAL_ERROR' 
    });
  }
};

export default withAuth(handler, 'admin');