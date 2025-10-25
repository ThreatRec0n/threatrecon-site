import { Request, Response } from 'express';
import { SessionService } from '../services/sessionService';
import { OrchestrationService } from '../services/orchestrationService';
import { ExportService } from '../services/exportService';
import { AuditService } from '../services/auditService';
import { logger } from '../utils/logger';
import { DrillSession, SessionEvent, Inject } from '../shared/types';

export class FacilitatorController {
  private sessionService: SessionService;
  private orchestrationService: OrchestrationService;
  private exportService: ExportService;
  private auditService: AuditService;

  constructor(
    sessionService: SessionService,
    orchestrationService: OrchestrationService,
    exportService: ExportService,
    auditService: AuditService
  ) {
    this.sessionService = sessionService;
    this.orchestrationService = orchestrationService;
    this.exportService = exportService;
    this.auditService = auditService;
  }

  /**
   * Pause an active drill session
   */
  async pauseSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const facilitatorRole = req.user?.role || 'FACILITATOR';
      const tenantId = req.tenantId;

      // Get session and verify facilitator access
      const session = await this.sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.status !== 'active') {
        res.status(400).json({ error: 'Session is not active' });
        return;
      }

      // Update session status
      await this.sessionService.updateSessionStatus(sessionId, 'paused');

      // Record audit event
      await this.auditService.recordFacilitatorAction({
        sessionId,
        actionType: 'PAUSE',
        facilitatorRole,
        timestamp: new Date(),
        metadata: { reason: 'Manual pause by facilitator' }
      });

      // Broadcast to all participants
      this.orchestrationService.broadcastToSession(sessionId, 'session-paused', {
        timestamp: new Date().toISOString(),
        reason: 'Paused by facilitator',
        facilitatorRole
      });

      logger.info(`Session ${sessionId} paused by facilitator ${facilitatorRole}`);

      res.json({ 
        success: true, 
        message: 'Session paused',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error pausing session:', error);
      res.status(500).json({ error: 'Failed to pause session' });
    }
  }

  /**
   * Resume a paused drill session
   */
  async resumeSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const facilitatorRole = req.user?.role || 'FACILITATOR';
      const tenantId = req.tenantId;

      // Get session and verify facilitator access
      const session = await this.sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.status !== 'paused') {
        res.status(400).json({ error: 'Session is not paused' });
        return;
      }

      // Update session status
      await this.sessionService.updateSessionStatus(sessionId, 'active');

      // Record audit event
      await this.auditService.recordFacilitatorAction({
        sessionId,
        actionType: 'RESUME',
        facilitatorRole,
        timestamp: new Date(),
        metadata: { reason: 'Manual resume by facilitator' }
      });

      // Broadcast to all participants
      this.orchestrationService.broadcastToSession(sessionId, 'session-resumed', {
        timestamp: new Date().toISOString(),
        facilitatorRole
      });

      logger.info(`Session ${sessionId} resumed by facilitator ${facilitatorRole}`);

      res.json({ 
        success: true, 
        message: 'Session resumed',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error resuming session:', error);
      res.status(500).json({ error: 'Failed to resume session' });
    }
  }

  /**
   * Send a manual inject during the session
   */
  async sendManualInject(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { type, content, target_roles, severity = 'info', injectId } = req.body;
      const facilitatorRole = req.user?.role || 'FACILITATOR';
      const tenantId = req.tenantId;

      // Validate required fields
      if (!type || !content || !target_roles || !Array.isArray(target_roles)) {
        res.status(400).json({ error: 'Missing required fields: type, content, target_roles' });
        return;
      }

      // Get session and verify facilitator access
      const session = await this.sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (!['active', 'paused'].includes(session.status)) {
        res.status(400).json({ error: 'Session is not active or paused' });
        return;
      }

      // Create manual inject
      const manualInject: Inject = {
        id: injectId || `manual_${Date.now()}`,
        time_offset_minutes: 0, // Immediate delivery
        type: type as any,
        target_roles,
        content,
        severity: severity as any,
        metadata: {
          source: 'facilitator',
          timestamp: new Date().toISOString(),
          facilitatorRole
        }
      };

      // Send inject immediately
      await this.orchestrationService.sendManualInject(sessionId, manualInject);

      // Record audit event
      await this.auditService.recordFacilitatorAction({
        sessionId,
        actionType: 'MANUAL_INJECT',
        facilitatorRole,
        timestamp: new Date(),
        metadata: {
          injectId: manualInject.id,
          type: manualInject.type,
          targetRoles: manualInject.target_roles,
          severity: manualInject.severity
        }
      });

      logger.info(`Manual inject sent to session ${sessionId} by facilitator ${facilitatorRole}`);

      res.json({ 
        success: true, 
        message: 'Manual inject sent',
        injectId: manualInject.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error sending manual inject:', error);
      res.status(500).json({ error: 'Failed to send manual inject' });
    }
  }

  /**
   * Escalate session severity
   */
  async escalateSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { level, message } = req.body;
      const facilitatorRole = req.user?.role || 'FACILITATOR';
      const tenantId = req.tenantId;

      // Validate severity level
      if (!['info', 'warning', 'critical'].includes(level)) {
        res.status(400).json({ error: 'Invalid severity level' });
        return;
      }

      // Get session and verify facilitator access
      const session = await this.sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Update session severity
      await this.sessionService.updateSessionSeverity(sessionId, level);

      // Record audit event
      await this.auditService.recordFacilitatorAction({
        sessionId,
        actionType: 'ESCALATE',
        facilitatorRole,
        timestamp: new Date(),
        metadata: {
          severityLevel: level,
          message: message || `Severity escalated to ${level.toUpperCase()}`
        }
      });

      // Broadcast escalation to all participants
      this.orchestrationService.broadcastToSession(sessionId, 'severity-escalated', {
        level,
        message: message || `Severity escalated to ${level.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        facilitatorRole
      });

      logger.info(`Session ${sessionId} escalated to ${level} by facilitator ${facilitatorRole}`);

      res.json({ 
        success: true, 
        message: `Severity escalated to ${level}`,
        level,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error escalating session:', error);
      res.status(500).json({ error: 'Failed to escalate session' });
    }
  }

  /**
   * End the drill session and trigger AAR generation
   */
  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { reason = 'Ended by facilitator' } = req.body;
      const facilitatorRole = req.user?.role || 'FACILITATOR';
      const tenantId = req.tenantId;

      // Get session and verify facilitator access
      const session = await this.sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.status === 'completed') {
        res.status(400).json({ error: 'Session already completed' });
        return;
      }

      // Update session status to completed
      await this.sessionService.updateSessionStatus(sessionId, 'completed');
      await this.sessionService.setSessionEndTime(sessionId, new Date());

      // Record audit event
      await this.auditService.recordFacilitatorAction({
        sessionId,
        actionType: 'END',
        facilitatorRole,
        timestamp: new Date(),
        metadata: { reason }
      });

      // Trigger AAR generation
      await this.exportService.generateAAR(sessionId, 'pdf');
      await this.exportService.generateAAR(sessionId, 'json');
      await this.exportService.generateAAR(sessionId, 'markdown');

      // Broadcast session end to all participants
      this.orchestrationService.broadcastToSession(sessionId, 'session-ended', {
        reason,
        timestamp: new Date().toISOString(),
        facilitatorRole,
        aarGenerating: true
      });

      logger.info(`Session ${sessionId} ended by facilitator ${facilitatorRole}`);

      res.json({ 
        success: true, 
        message: 'Session ended and AAR generation started',
        timestamp: new Date().toISOString(),
        aarGenerating: true
      });

    } catch (error) {
      logger.error('Error ending session:', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  }

  /**
   * Delete session and trigger purge
   */
  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const facilitatorRole = req.user?.role || 'FACILITATOR';
      const tenantId = req.tenantId;

      // Get session and verify facilitator access
      const session = await this.sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Soft delete session
      await this.sessionService.softDeleteSession(sessionId);

      // Enqueue immediate purge job
      await this.orchestrationService.enqueuePurgeJob(sessionId);

      // Record audit event
      await this.auditService.recordFacilitatorAction({
        sessionId,
        actionType: 'DELETE',
        facilitatorRole,
        timestamp: new Date(),
        metadata: { reason: 'Session deleted by facilitator' }
      });

      logger.info(`Session ${sessionId} deleted by facilitator ${facilitatorRole}`);

      res.json({ 
        success: true, 
        message: 'Session deleted and purge queued',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  }

  /**
   * Get facilitator dashboard data
   */
  async getFacilitatorDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const tenantId = req.tenantId;

      // Get session
      const session = await this.sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Get recent decisions
      const recentDecisions = await this.sessionService.getRecentDecisions(sessionId, 50);

      // Get audit trail
      const auditTrail = await this.auditService.getSessionAuditTrail(sessionId);

      // Get queued injects
      const queuedInjects = await this.orchestrationService.getQueuedInjects(sessionId);

      res.json({
        session: {
          id: session.id,
          status: session.status,
          startedAt: session.startedAt,
          elapsedTime: session.startedAt ? Date.now() - session.startedAt.getTime() : 0,
          participants: session.participants,
          scores: session.scores
        },
        recentDecisions,
        auditTrail,
        queuedInjects
      });

    } catch (error) {
      logger.error('Error getting facilitator dashboard:', error);
      res.status(500).json({ error: 'Failed to get facilitator dashboard' });
    }
  }
}
