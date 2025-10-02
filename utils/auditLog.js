import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// Audit log event types
export const AUDIT_EVENTS = {
  // User Management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  
  // Admin Management
  ADMIN_ADDED: 'admin_added',
  ADMIN_REMOVED: 'admin_removed',
  ADMIN_ROLE_CHANGED: 'admin_role_changed',
  
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  
  // Data Access
  DATA_ACCESSED: 'data_accessed',
  DATA_EXPORTED: 'data_exported',
  BULK_OPERATION: 'bulk_operation',
  
  // System Events
  SYSTEM_ERROR: 'system_error',
  SECURITY_VIOLATION: 'security_violation',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  
  // Events Management
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_DELETED: 'event_deleted',
  
  // Raffle Management
  RAFFLE_CREATED: 'raffle_created',
  RAFFLE_WINNER_SELECTED: 'raffle_winner_selected',
  
  // Social Platform
  POST_MODERATED: 'post_moderated',
  COMMENT_DELETED: 'comment_deleted',
  USER_BANNED: 'user_banned',
  
  // Tickets
  TICKET_STATUS_CHANGED: 'ticket_status_changed',
  TICKET_ASSIGNED: 'ticket_assigned'
};

// Audit log levels
export const AUDIT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

class AuditLogger {
  constructor() {
    this.logQueue = [];
    this.isProcessing = false;
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    
    // Start automatic batch processing
    this.startBatchProcessor();
  }

  async log(eventType, details = {}) {
    const logEntry = this.createLogEntry(eventType, details);
    
    // Add to queue for batch processing
    this.logQueue.push(logEntry);
    
    // If critical, flush immediately
    if (details.level === AUDIT_LEVELS.CRITICAL) {
      await this.flush();
    }
    
    return logEntry.id;
  }

  createLogEntry(eventType, details) {
    const timestamp = Timestamp.now();
    const sessionId = this.generateSessionId();
    
    return {
      id: `${timestamp.seconds}_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp,
      level: details.level || AUDIT_LEVELS.INFO,
      
      // User information
      actorEmail: details.actorEmail || 'system',
      actorRole: details.actorRole || 'unknown',
      actorIP: details.actorIP,
      
      // Target information
      targetEmail: details.targetEmail,
      targetId: details.targetId,
      targetType: details.targetType,
      
      // Request information
      sessionId,
      userAgent: details.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'server'),
      requestId: details.requestId,
      
      // Event details
      action: details.action,
      resource: details.resource,
      oldValue: details.oldValue,
      newValue: details.newValue,
      metadata: details.metadata || {},
      
      // Security information
      riskScore: this.calculateRiskScore(eventType, details),
      tags: this.generateTags(eventType, details),
      
      // Error information (if applicable)
      error: details.error,
      stackTrace: details.stackTrace
    };
  }

  calculateRiskScore(eventType, details) {
    let score = 0;
    
    // Base scores by event type
    const eventScores = {
      [AUDIT_EVENTS.ADMIN_ADDED]: 8,
      [AUDIT_EVENTS.ADMIN_REMOVED]: 9,
      [AUDIT_EVENTS.USER_DELETED]: 6,
      [AUDIT_EVENTS.BULK_OPERATION]: 7,
      [AUDIT_EVENTS.DATA_EXPORTED]: 5,
      [AUDIT_EVENTS.SECURITY_VIOLATION]: 10,
      [AUDIT_EVENTS.LOGIN_FAILED]: 3,
      [AUDIT_EVENTS.RATE_LIMIT_EXCEEDED]: 4
    };
    
    score = eventScores[eventType] || 1;
    
    // Increase score for sensitive operations
    if (details.actorRole === 'admin') score += 2;
    if (details.targetType === 'admin') score += 3;
    if (details.level === AUDIT_LEVELS.ERROR) score += 2;
    if (details.level === AUDIT_LEVELS.CRITICAL) score += 5;
    
    return Math.min(score, 10);
  }

  generateTags(eventType, details) {
    const tags = [eventType];
    
    if (details.actorRole) tags.push(`actor:${details.actorRole}`);
    if (details.targetType) tags.push(`target:${details.targetType}`);
    if (details.level) tags.push(`level:${details.level}`);
    if (details.resource) tags.push(`resource:${details.resource}`);
    
    return tags;
  }

  generateSessionId() {
    if (typeof window !== 'undefined') {
      // Client-side: check if functional cookies are allowed
      try {
        const consent = localStorage.getItem('cookieConsent');
        const consentObj = consent ? JSON.parse(consent) : null;

        // Only use sessionStorage if functional cookies are allowed
        if (consentObj?.functional) {
          let sessionId = sessionStorage.getItem('auditSessionId');
          if (!sessionId) {
            sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            sessionStorage.setItem('auditSessionId', sessionId);
          }
          return sessionId;
        }
      } catch (error) {
        console.error('Error checking cookie consent:', error);
      }

      // If functional cookies not allowed, generate temporary session ID
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    } else {
      // Server-side: generate unique ID
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  }

  startBatchProcessor() {
    setInterval(async () => {
      if (this.logQueue.length > 0) {
        await this.flush();
      }
    }, this.flushInterval);
  }

  async flush() {
    if (this.isProcessing || this.logQueue.length === 0) return;
    
    this.isProcessing = true;
    const logsToProcess = this.logQueue.splice(0, this.batchSize);
    
    try {
      // Write logs to Firestore in batch
      const promises = logsToProcess.map(logEntry => 
        addDoc(collection(db, "audit_logs"), logEntry)
      );
      
      await Promise.all(promises);
      
    } catch (error) {
      console.error('Failed to write audit logs:', error);
      // Put logs back in queue for retry
      this.logQueue.unshift(...logsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  // Force flush all queued logs
  async forceFlush() {
    while (this.logQueue.length > 0) {
      await this.flush();
    }
  }
}

// Global audit logger instance
const auditLogger = new AuditLogger();

// Convenience functions for different event types
export const logAdminAction = async (actorEmail, actorRole, action, targetEmail, details = {}) => {
  return await auditLogger.log(AUDIT_EVENTS.ADMIN_ADDED, {
    actorEmail,
    actorRole,
    action,
    targetEmail,
    targetType: 'user',
    level: AUDIT_LEVELS.WARNING,
    ...details
  });
};

export const logUserAction = async (userEmail, action, resource, details = {}) => {
  return await auditLogger.log(AUDIT_EVENTS.DATA_ACCESSED, {
    actorEmail: userEmail,
    action,
    resource,
    ...details
  });
};

export const logSecurityEvent = async (eventType, details = {}) => {
  return await auditLogger.log(eventType, {
    level: AUDIT_LEVELS.ERROR,
    ...details
  });
};

export const logSystemError = async (error, context = {}) => {
  return await auditLogger.log(AUDIT_EVENTS.SYSTEM_ERROR, {
    level: AUDIT_LEVELS.ERROR,
    error: error.message,
    stackTrace: error.stack,
    ...context
  });
};

export const logDataAccess = async (userEmail, userRole, resource, action = 'read', details = {}) => {
  return await auditLogger.log(AUDIT_EVENTS.DATA_ACCESSED, {
    actorEmail: userEmail,
    actorRole: userRole,
    resource,
    action,
    ...details
  });
};

// Higher-order function for automatic logging
export const withAuditLog = (eventType, options = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = Date.now();
      let result;
      let error;
      
      try {
        result = await originalMethod.apply(this, args);
        
        // Log successful operation
        await auditLogger.log(eventType, {
          action: propertyKey,
          duration: Date.now() - startTime,
          success: true,
          ...options
        });
        
        return result;
      } catch (err) {
        error = err;
        
        // Log failed operation
        await auditLogger.log(eventType, {
          action: propertyKey,
          duration: Date.now() - startTime,
          success: false,
          error: err.message,
          level: AUDIT_LEVELS.ERROR,
          ...options
        });
        
        throw err;
      }
    };
    
    return descriptor;
  };
};

export default auditLogger;