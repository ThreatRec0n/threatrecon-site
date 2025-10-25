import { logger } from '../utils/logger';
import { AuditEvent, FacilitatorAction } from '../shared/types';

export class AuditService {
  private auditEvents: Map<string, AuditEvent[]> = new Map();

  constructor() {
    // Initialize with empty audit trails
  }

  /**
   * Record a facilitator action in the audit trail
   */
  async recordFacilitatorAction(action: FacilitatorAction): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: this.generateId(),
        sessionId: action.sessionId,
        type: 'facilitator_action',
        timestamp: action.timestamp,
        facilitatorRole: action.facilitatorRole,
        actionType: action.actionType,
        metadata: action.metadata
      };

      // Store in memory (in production, this would be persisted to database)
      const sessionAuditTrail = this.auditEvents.get(action.sessionId) || [];
      sessionAuditTrail.push(auditEvent);
      this.auditEvents.set(action.sessionId, sessionAuditTrail);

      logger.info(`Audit event recorded: ${action.actionType} by ${action.facilitatorRole}`, {
        sessionId: action.sessionId,
        actionType: action.actionType,
        timestamp: action.timestamp
      });

    } catch (error) {
      logger.error('Error recording facilitator action:', error);
      throw error;
    }
  }

  /**
   * Record a participant decision
   */
  async recordParticipantDecision(sessionId: string, role: string, decision: any): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: this.generateId(),
        sessionId,
        type: 'participant_decision',
        timestamp: new Date(),
        participantRole: role,
        actionType: 'DECISION',
        metadata: {
          action: decision.action,
          parameters: decision.parameters,
          rationale: decision.rationale,
          confidence: decision.confidence
        }
      };

      const sessionAuditTrail = this.auditEvents.get(sessionId) || [];
      sessionAuditTrail.push(auditEvent);
      this.auditEvents.set(sessionId, sessionAuditTrail);

      logger.info(`Participant decision recorded: ${role} - ${decision.action}`, {
        sessionId,
        role,
        action: decision.action
      });

    } catch (error) {
      logger.error('Error recording participant decision:', error);
      throw error;
    }
  }

  /**
   * Record an inject delivery
   */
  async recordInjectDelivery(sessionId: string, inject: any): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: this.generateId(),
        sessionId,
        type: 'inject_delivery',
        timestamp: new Date(),
        actionType: 'INJECT_DELIVERED',
        metadata: {
          injectId: inject.id,
          injectType: inject.type,
          targetRoles: inject.target_roles,
          severity: inject.severity,
          content: inject.content.substring(0, 100) + '...' // Truncate for audit
        }
      };

      const sessionAuditTrail = this.auditEvents.get(sessionId) || [];
      sessionAuditTrail.push(auditEvent);
      this.auditEvents.set(sessionId, sessionAuditTrail);

      logger.info(`Inject delivery recorded: ${inject.id}`, {
        sessionId,
        injectId: inject.id,
        targetRoles: inject.target_roles
      });

    } catch (error) {
      logger.error('Error recording inject delivery:', error);
      throw error;
    }
  }

  /**
   * Record a session milestone
   */
  async recordMilestone(sessionId: string, milestone: string, metadata?: any): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: this.generateId(),
        sessionId,
        type: 'milestone',
        timestamp: new Date(),
        actionType: 'MILESTONE',
        metadata: {
          milestone,
          ...metadata
        }
      };

      const sessionAuditTrail = this.auditEvents.get(sessionId) || [];
      sessionAuditTrail.push(auditEvent);
      this.auditEvents.set(sessionId, sessionAuditTrail);

      logger.info(`Milestone recorded: ${milestone}`, {
        sessionId,
        milestone
      });

    } catch (error) {
      logger.error('Error recording milestone:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a session
   */
  async getSessionAuditTrail(sessionId: string): Promise<AuditEvent[]> {
    try {
      const auditTrail = this.auditEvents.get(sessionId) || [];
      
      // Return sorted by timestamp
      return auditTrail.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    } catch (error) {
      logger.error('Error getting session audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit trail for AAR generation
   */
  async getAARAuditTrail(sessionId: string): Promise<AuditEvent[]> {
    try {
      const auditTrail = await this.getSessionAuditTrail(sessionId);
      
      // Filter and format for AAR inclusion
      return auditTrail.map(event => ({
        ...event,
        // Ensure sensitive data is not included in AAR
        metadata: this.sanitizeMetadataForAAR(event.metadata)
      }));

    } catch (error) {
      logger.error('Error getting AAR audit trail:', error);
      return [];
    }
  }

  /**
   * Purge audit trail for a session
   */
  async purgeSessionAuditTrail(sessionId: string): Promise<void> {
    try {
      this.auditEvents.delete(sessionId);
      
      logger.info(`Audit trail purged for session: ${sessionId}`);

    } catch (error) {
      logger.error('Error purging audit trail:', error);
      throw error;
    }
  }

  /**
   * Generate audit trail summary for AAR
   */
  async generateAuditSummary(sessionId: string): Promise<{
    totalEvents: number;
    facilitatorActions: number;
    participantDecisions: number;
    injectDeliveries: number;
    milestones: number;
    timeline: Array<{
      timestamp: Date;
      type: string;
      description: string;
    }>;
  }> {
    try {
      const auditTrail = await this.getSessionAuditTrail(sessionId);
      
      const summary = {
        totalEvents: auditTrail.length,
        facilitatorActions: auditTrail.filter(e => e.type === 'facilitator_action').length,
        participantDecisions: auditTrail.filter(e => e.type === 'participant_decision').length,
        injectDeliveries: auditTrail.filter(e => e.type === 'inject_delivery').length,
        milestones: auditTrail.filter(e => e.type === 'milestone').length,
        timeline: auditTrail.map(event => ({
          timestamp: event.timestamp,
          type: event.type,
          description: this.formatEventDescription(event)
        }))
      };

      return summary;

    } catch (error) {
      logger.error('Error generating audit summary:', error);
      return {
        totalEvents: 0,
        facilitatorActions: 0,
        participantDecisions: 0,
        injectDeliveries: 0,
        milestones: 0,
        timeline: []
      };
    }
  }

  /**
   * Sanitize metadata for AAR inclusion
   */
  private sanitizeMetadataForAAR(metadata: any): any {
    if (!metadata) return {};

    const sanitized = { ...metadata };
    
    // Remove any potential PII or sensitive data
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.ssn;
    delete sanitized.password;
    delete sanitized.token;
    
    // Truncate long content
    if (sanitized.content && sanitized.content.length > 200) {
      sanitized.content = sanitized.content.substring(0, 200) + '...';
    }

    return sanitized;
  }

  /**
   * Format event description for timeline
   */
  private formatEventDescription(event: AuditEvent): string {
    switch (event.type) {
      case 'facilitator_action':
        return `${event.facilitatorRole} ${event.actionType.toLowerCase().replace('_', ' ')}`;
      case 'participant_decision':
        return `${event.participantRole} decision: ${event.metadata?.action || 'Unknown'}`;
      case 'inject_delivery':
        return `Inject delivered: ${event.metadata?.injectType || 'Unknown'} to ${event.metadata?.targetRoles?.join(', ') || 'Unknown'}`;
      case 'milestone':
        return `Milestone: ${event.metadata?.milestone || 'Unknown'}`;
      default:
        return `Event: ${event.actionType || 'Unknown'}`;
    }
  }

  /**
   * Generate unique ID for audit events
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
