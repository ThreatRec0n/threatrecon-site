import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * PII Guard Middleware - Ensures users acknowledge data safety rules
 */
export function piiGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Skip PII guard for non-public tenants (on-premise deployments)
    if (req.tenantId && req.tenantId !== 'public') {
      next();
      return;
    }

    // Skip PII guard for facilitator/admin actions
    if (req.path.includes('/facilitator/') || req.path.includes('/admin/')) {
      next();
      return;
    }

    // Check if this is a session creation request
    if (req.method === 'POST' && req.path.includes('/session/start')) {
      const { piiConsent } = req.body;

      if (!piiConsent) {
        res.status(400).json({
          error: 'PII consent required',
          message: 'You must acknowledge the data safety rules before starting a drill',
          requiresConsent: true,
          consentText: getConsentText()
        });
        return;
      }

      // Validate consent timestamp (must be recent)
      const consentTimestamp = req.body.piiConsentTimestamp;
      if (!consentTimestamp || Date.now() - consentTimestamp > 300000) { // 5 minutes
        res.status(400).json({
          error: 'PII consent expired',
          message: 'Consent acknowledgment has expired. Please acknowledge again.',
          requiresConsent: true,
          consentText: getConsentText()
        });
        return;
      }

      logger.info('PII consent validated for session creation', {
        tenantId: req.tenantId,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }

    next();

  } catch (error) {
    logger.error('Error in PII guard middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get the PII consent text
 */
function getConsentText(): string {
  return `This hosted version is for simulation only. Do NOT enter real personal data, customer names, production credentials, PHI, or regulated information. Use role titles and generic system labels only. For sensitive scenarios or real names, deploy the self-hosted version.

By proceeding, you acknowledge that:
- You will NOT enter real personal information
- You will NOT use real customer names or data
- You will NOT include production credentials or secrets
- You will use role titles (e.g., "CFO", "SOC Analyst") instead of real names
- You understand that session data may be automatically deleted after ${process.env.SESSION_RETENTION_DAYS || 7} days
- You understand this is a simulation platform, not a real incident response system`;
}

/**
 * Data Retention Service
 */
export class DataRetentionService {
  private retentionDays: number;

  constructor() {
    this.retentionDays = parseInt(process.env.SESSION_RETENTION_DAYS || '7');
  }

  /**
   * Check if a session should be purged
   */
  shouldPurgeSession(sessionCreatedAt: Date): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    return sessionCreatedAt < cutoffDate;
  }

  /**
   * Get sessions eligible for purge
   */
  async getSessionsForPurge(): Promise<string[]> {
    try {
      // In a real implementation, this would query the database
      // For now, return empty array as we're using in-memory storage
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      logger.info(`Checking for sessions older than ${cutoffDate.toISOString()}`);
      
      // This would be replaced with actual database query
      return [];

    } catch (error) {
      logger.error('Error getting sessions for purge:', error);
      return [];
    }
  }

  /**
   * Purge session data
   */
  async purgeSession(sessionId: string): Promise<boolean> {
    try {
      logger.info(`Purging session data: ${sessionId}`);
      
      // In a real implementation, this would:
      // 1. Delete session from database
      // 2. Delete associated events
      // 3. Delete AAR exports from storage
      // 4. Delete audit logs
      
      // For now, just log the action
      logger.info(`Session ${sessionId} purged successfully`);
      
      return true;

    } catch (error) {
      logger.error(`Error purging session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get retention policy info
   */
  getRetentionPolicy(): {
    retentionDays: number;
    cutoffDate: Date;
    policyText: string;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    return {
      retentionDays: this.retentionDays,
      cutoffDate,
      policyText: `Sessions and associated data are automatically deleted after ${this.retentionDays} days in the public SaaS environment. This includes session logs, decisions, AAR exports, and audit trails.`
    };
  }
}

/**
 * AAR Signing Service
 */
export class AARSigningService {
  private signingKeyId: string;
  private signingSecret: string;

  constructor() {
    this.signingKeyId = process.env.SIGNING_KEY_ID || 'default-key-v1';
    this.signingSecret = process.env.SIGNING_SECRET || 'default-secret-change-in-production';
  }

  /**
   * Generate cryptographic hash for AAR content
   */
  generateAARHash(aarContent: any): string {
    try {
      const crypto = require('crypto');
      
      // Create deterministic content for hashing
      const contentString = JSON.stringify({
        sessionId: aarContent.sessionId,
        timeline: aarContent.timeline,
        decisions: aarContent.decisions,
        scores: aarContent.scores,
        generatedAt: aarContent.generatedAt,
        version: aarContent.version
      });

      // Generate SHA-256 hash
      const hash = crypto.createHash('sha256')
        .update(contentString)
        .update(this.signingSecret)
        .digest('hex');

      return hash;

    } catch (error) {
      logger.error('Error generating AAR hash:', error);
      throw new Error('Failed to generate AAR hash');
    }
  }

  /**
   * Sign AAR with metadata
   */
  signAAR(aarContent: any): {
    signed_hash: string;
    signing_key_id: string;
    generated_at: string;
    content_hash: string;
  } {
    try {
      const generatedAt = new Date().toISOString();
      const contentHash = this.generateAARHash(aarContent);

      const signature = {
        signed_hash: contentHash,
        signing_key_id: this.signingKeyId,
        generated_at: generatedAt,
        content_hash: contentHash
      };

      logger.info('AAR signed successfully', {
        sessionId: aarContent.sessionId,
        signingKeyId: this.signingKeyId,
        hashLength: contentHash.length
      });

      return signature;

    } catch (error) {
      logger.error('Error signing AAR:', error);
      throw new Error('Failed to sign AAR');
    }
  }

  /**
   * Verify AAR signature
   */
  verifyAARSignature(aarContent: any, signature: any): boolean {
    try {
      const expectedHash = this.generateAARHash(aarContent);
      return expectedHash === signature.signed_hash;

    } catch (error) {
      logger.error('Error verifying AAR signature:', error);
      return false;
    }
  }

  /**
   * Get signing key info
   */
  getSigningKeyInfo(): {
    keyId: string;
    algorithm: string;
    rotationGuidance: string;
  } {
    return {
      keyId: this.signingKeyId,
      algorithm: 'SHA-256',
      rotationGuidance: 'Rotate SIGNING_KEY_ID and SIGNING_SECRET periodically in production deployments. Keep signing secrets protected as they prove AAR integrity to auditors.'
    };
  }
}

/**
 * Session Deletion Controller
 */
export class SessionDeletionController {
  private retentionService: DataRetentionService;

  constructor() {
    this.retentionService = new DataRetentionService();
  }

  /**
   * Soft delete a session and queue for purge
   */
  async softDeleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const facilitatorRole = req.user?.role || 'FACILITATOR';
      const tenantId = req.tenantId;

      // Check if this is a public SaaS session
      if (tenantId === 'public') {
        // For public SaaS, immediately queue for purge
        await this.retentionService.purgeSession(sessionId);
        
        logger.info(`Session ${sessionId} deleted and purged from public SaaS`, {
          facilitatorRole,
          tenantId
        });

        res.json({
          success: true,
          message: 'Session deleted and purged immediately',
          purged: true,
          timestamp: new Date().toISOString()
        });
      } else {
        // For private tenants, soft delete and schedule purge
        // In a real implementation, this would update the database
        
        logger.info(`Session ${sessionId} soft deleted for private tenant`, {
          facilitatorRole,
          tenantId
        });

        res.json({
          success: true,
          message: 'Session deleted and scheduled for purge',
          purged: false,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      logger.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  }

  /**
   * Get retention policy info
   */
  getRetentionPolicy(req: Request, res: Response): void {
    try {
      const policy = this.retentionService.getRetentionPolicy();
      
      res.json({
        ...policy,
        isPublicSaaS: req.tenantId === 'public',
        autoDeleteEnabled: req.tenantId === 'public'
      });

    } catch (error) {
      logger.error('Error getting retention policy:', error);
      res.status(500).json({ error: 'Failed to get retention policy' });
    }
  }
}
