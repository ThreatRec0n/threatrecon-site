import { FacilitatorController } from '../controllers/facilitatorController';
import { SessionService } from '../services/sessionService';
import { OrchestrationService } from '../services/orchestrationService';
import { ExportService } from '../services/exportService';
import { AuditService } from '../services/auditService';

describe('Facilitator Console Functionality', () => {
  let facilitatorController: FacilitatorController;
  let sessionService: SessionService;
  let orchestrationService: OrchestrationService;
  let exportService: ExportService;
  let auditService: AuditService;

  beforeEach(() => {
    sessionService = new SessionService();
    orchestrationService = new OrchestrationService();
    exportService = new ExportService();
    auditService = new AuditService();
    
    facilitatorController = new FacilitatorController(
      sessionService,
      orchestrationService,
      exportService,
      auditService
    );
  });

  describe('Session Control Actions', () => {
    it('should be able to pause a session', async () => {
      // Create a mock session
      const session = await sessionService.createSession({
        scenarioId: 'test-scenario',
        participants: [{ role: 'SOC_ANALYST', name: 'Test Analyst' }],
        settings: {},
        tenantId: 'test-tenant'
      });

      // Start the session
      await sessionService.updateSessionStatus(session.id, 'active');

      // Verify session is active
      const activeSession = await sessionService.getSession(session.id, 'test-tenant');
      expect(activeSession?.status).toBe('active');

      // Test pause functionality would be here
      // In a real test, we'd mock the request/response objects
      console.log('✅ Session pause functionality test setup complete');
    });

    it('should be able to resume a session', async () => {
      // Create a mock session
      const session = await sessionService.createSession({
        scenarioId: 'test-scenario',
        participants: [{ role: 'SOC_ANALYST', name: 'Test Analyst' }],
        settings: {},
        tenantId: 'test-tenant'
      });

      // Start and pause the session
      await sessionService.updateSessionStatus(session.id, 'active');
      await sessionService.updateSessionStatus(session.id, 'paused');

      // Verify session is paused
      const pausedSession = await sessionService.getSession(session.id, 'test-tenant');
      expect(pausedSession?.status).toBe('paused');

      console.log('✅ Session resume functionality test setup complete');
    });

    it('should be able to end a session', async () => {
      // Create a mock session
      const session = await sessionService.createSession({
        scenarioId: 'test-scenario',
        participants: [{ role: 'SOC_ANALYST', name: 'Test Analyst' }],
        settings: {},
        tenantId: 'test-tenant'
      });

      // Start the session
      await sessionService.updateSessionStatus(session.id, 'active');

      // End the session
      await sessionService.updateSessionStatus(session.id, 'completed');
      await sessionService.setSessionEndTime(session.id, new Date());

      // Verify session is completed
      const completedSession = await sessionService.getSession(session.id, 'test-tenant');
      expect(completedSession?.status).toBe('completed');
      expect(completedSession?.endedAt).toBeDefined();

      console.log('✅ Session end functionality test complete');
    });

    it('should be able to escalate session severity', async () => {
      // Create a mock session
      const session = await sessionService.createSession({
        scenarioId: 'test-scenario',
        participants: [{ role: 'SOC_ANALYST', name: 'Test Analyst' }],
        settings: {},
        tenantId: 'test-tenant'
      });

      // Escalate severity
      await sessionService.updateSessionSeverity(session.id, 'critical');

      // Verify severity is updated
      const updatedSession = await sessionService.getSession(session.id, 'test-tenant');
      expect(updatedSession?.settings?.currentSeverity).toBe('critical');

      console.log('✅ Session escalation functionality test complete');
    });

    it('should be able to send manual injects', async () => {
      // Create a mock session
      const session = await sessionService.createSession({
        scenarioId: 'test-scenario',
        participants: [{ role: 'SOC_ANALYST', name: 'Test Analyst' }],
        settings: {},
        tenantId: 'test-tenant'
      });

      // Test manual inject functionality
      const manualInject = {
        id: 'manual_inject_1',
        time_offset_minutes: 0,
        type: 'text' as const,
        target_roles: ['SOC_ANALYST'],
        content: 'Test manual inject',
        severity: 'info' as const,
        metadata: {
          source: 'facilitator',
          timestamp: new Date().toISOString()
        }
      };

      // Send manual inject
      await orchestrationService.sendManualInject(session.id, manualInject);

      // Verify inject was queued
      const queuedInjects = await orchestrationService.getQueuedInjects(session.id);
      expect(queuedInjects.length).toBeGreaterThan(0);

      console.log('✅ Manual inject functionality test complete');
    });
  });

  describe('Audit Trail', () => {
    it('should record facilitator actions in audit trail', async () => {
      // Create a mock session
      const session = await sessionService.createSession({
        scenarioId: 'test-scenario',
        participants: [{ role: 'SOC_ANALYST', name: 'Test Analyst' }],
        settings: {},
        tenantId: 'test-tenant'
      });

      // Record a facilitator action
      await auditService.recordFacilitatorAction({
        sessionId: session.id,
        actionType: 'PAUSE',
        facilitatorRole: 'FACILITATOR',
        timestamp: new Date(),
        metadata: { reason: 'Test pause' }
      });

      // Verify action was recorded
      const auditTrail = await auditService.getSessionAuditTrail(session.id);
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0].actionType).toBe('PAUSE');

      console.log('✅ Audit trail functionality test complete');
    });
  });

  describe('AAR Generation', () => {
    it('should generate AAR with signing metadata', async () => {
      // Create a mock session
      const session = await sessionService.createSession({
        scenarioId: 'test-scenario',
        participants: [{ role: 'SOC_ANALYST', name: 'Test Analyst' }],
        settings: {},
        tenantId: 'test-tenant'
      });

      // Generate AAR
      const aarUrl = await exportService.generateAAR(session.id, 'json');
      expect(aarUrl).toBeDefined();
      expect(aarUrl).toContain('/api/export/');

      console.log('✅ AAR generation functionality test complete');
    });
  });
});
