import { Router } from 'express';
import { FacilitatorController } from '../controllers/facilitatorController';
import { SessionService } from '../services/sessionService';
import { OrchestrationService } from '../services/orchestrationService';
import { ExportService } from '../services/exportService';
import { AuditService } from '../services/auditService';
import { authMiddleware } from '../middleware/authMiddleware';
import { facilitatorMiddleware } from '../middleware/facilitatorMiddleware';

const router = Router();

// Initialize services
const sessionService = new SessionService();
const orchestrationService = new OrchestrationService();
const exportService = new ExportService();
const auditService = new AuditService();

// Initialize controller
const facilitatorController = new FacilitatorController(
  sessionService,
  orchestrationService,
  exportService,
  auditService
);

// Apply authentication and facilitator role middleware to all routes
router.use(authMiddleware);
router.use(facilitatorMiddleware);

/**
 * @route POST /api/session/:sessionId/pause
 * @desc Pause an active drill session
 * @access Facilitator only
 */
router.post('/session/:sessionId/pause', (req, res) => {
  facilitatorController.pauseSession(req, res);
});

/**
 * @route POST /api/session/:sessionId/resume
 * @desc Resume a paused drill session
 * @access Facilitator only
 */
router.post('/session/:sessionId/resume', (req, res) => {
  facilitatorController.resumeSession(req, res);
});

/**
 * @route POST /api/session/:sessionId/inject
 * @desc Send a manual inject during the session
 * @access Facilitator only
 */
router.post('/session/:sessionId/inject', (req, res) => {
  facilitatorController.sendManualInject(req, res);
});

/**
 * @route POST /api/session/:sessionId/escalate
 * @desc Escalate session severity
 * @access Facilitator only
 */
router.post('/session/:sessionId/escalate', (req, res) => {
  facilitatorController.escalateSession(req, res);
});

/**
 * @route POST /api/session/:sessionId/end
 * @desc End the drill session and trigger AAR generation
 * @access Facilitator only
 */
router.post('/session/:sessionId/end', (req, res) => {
  facilitatorController.endSession(req, res);
});

/**
 * @route POST /api/session/:sessionId/delete
 * @desc Delete session and trigger purge
 * @access Facilitator only
 */
router.post('/session/:sessionId/delete', (req, res) => {
  facilitatorController.deleteSession(req, res);
});

/**
 * @route GET /api/facilitator/:sessionId/dashboard
 * @desc Get facilitator dashboard data
 * @access Facilitator only
 */
router.get('/facilitator/:sessionId/dashboard', (req, res) => {
  facilitatorController.getFacilitatorDashboard(req, res);
});

export default router;
