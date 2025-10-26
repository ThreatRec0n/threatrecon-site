import { Router } from 'express';
import { Request, Response } from 'express';
import { SessionService } from '../services/sessionService';
import { OrchestrationService } from '../services/orchestrationService';
import { ScenarioService } from '../services/scenarioService';
import { ScenarioValidator } from '../services/scenarioValidator';
import { piiGuardMiddleware } from '../middleware/piiGuard';
import { validateRequest, ValidationSchemas } from '../middleware/validation';
import { authMiddleware } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

const router = Router();

// Initialize services
const sessionService = new SessionService();
const orchestrationService = new OrchestrationService();
const scenarioService = new ScenarioService();
const scenarioValidator = new ScenarioValidator();

/**
 * @route POST /api/session/start
 * @desc Start a new drill session with scenario validation
 * @access Authenticated users
 */
router.post('/start', 
  authMiddleware,
  piiGuardMiddleware,
  validateRequest(ValidationSchemas.sessionStart),
  async (req: Request, res: Response) => {
    try {
      const { scenarioId, participants, settings, piiConsent, piiConsentTimestamp } = req.body;
      const tenantId = req.tenantId || 'public';

      logger.info(`Starting session for scenario ${scenarioId}`, {
        participantCount: participants.length,
        tenantId,
        piiConsent
      });

      // Load the scenario
      const scenario = await scenarioService.getScenario(scenarioId, tenantId);
      if (!scenario) {
        res.status(404).json({ 
          error: 'Scenario not found',
          scenarioId 
        });
        return;
      }

      // Validate the scenario before starting
      const validationResult = await scenarioValidator.validateScenario(scenario);
      
      if (validationResult.status === 'fail') {
        logger.warn(`Scenario validation failed for ${scenarioId}`, {
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });

        res.status(400).json({
          error: 'Scenario validation failed',
          message: 'The scenario contains errors that prevent it from running safely',
          validationResult
        });
        return;
      }

      // Log warnings if any
      if (validationResult.status === 'warn' && validationResult.warnings.length > 0) {
        logger.warn(`Scenario validation warnings for ${scenarioId}`, {
          warnings: validationResult.warnings
        });
      }

      // Create the session
      const session = await sessionService.createSession({
        scenarioId,
        participants,
        settings: {
          ...settings,
          validationWarnings: validationResult.warnings,
          piiConsent,
          piiConsentTimestamp
        },
        tenantId
      });

      // Start orchestration
      await orchestrationService.startSession(session.id, scenario);

      // Update session status to active
      await sessionService.updateSessionStatus(session.id, 'active');

      logger.info(`Session started successfully`, {
        sessionId: session.id,
        scenarioId,
        participantCount: participants.length,
        validationStatus: validationResult.status
      });

      res.status(201).json({
        success: true,
        session: {
          id: session.id,
          scenarioId: session.scenarioId,
          status: session.status,
          participants: session.participants,
          settings: session.settings,
          startedAt: session.startedAt,
          validationWarnings: validationResult.warnings
        },
        message: 'Session started successfully'
      });

    } catch (error) {
      logger.error('Error starting session:', error);
      res.status(500).json({ 
        error: 'Failed to start session',
        message: 'An internal error occurred while starting the session'
      });
    }
  }
);

/**
 * @route GET /api/session/:sessionId
 * @desc Get session details
 * @access Authenticated users
 */
router.get('/:sessionId', 
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const tenantId = req.tenantId || 'public';

      const session = await sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json({
        success: true,
        session: {
          id: session.id,
          scenarioId: session.scenarioId,
          status: session.status,
          participants: session.participants,
          settings: session.settings,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          createdAt: session.createdAt
        }
      });

    } catch (error) {
      logger.error('Error getting session:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  }
);

/**
 * @route GET /api/session/:sessionId/decisions
 * @desc Get session decisions
 * @access Authenticated users
 */
router.get('/:sessionId/decisions', 
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const tenantId = req.tenantId || 'public';

      // Verify session exists and user has access
      const session = await sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const decisions = await sessionService.getRecentDecisions(sessionId, limit);

      res.json({
        success: true,
        decisions,
        count: decisions.length
      });

    } catch (error) {
      logger.error('Error getting session decisions:', error);
      res.status(500).json({ error: 'Failed to get session decisions' });
    }
  }
);

/**
 * @route POST /api/session/:sessionId/decisions
 * @desc Submit a decision for the session
 * @access Authenticated users
 */
router.post('/:sessionId/decisions', 
  authMiddleware,
  validateRequest(ValidationSchemas.decision),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const decision = req.body;
      const tenantId = req.tenantId || 'public';

      // Verify session exists and user has access
      const session = await sessionService.getSession(sessionId, tenantId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.status !== 'active') {
        res.status(400).json({ error: 'Session is not active' });
        return;
      }

      // Add timestamp and session ID
      decision.sessionId = sessionId;
      decision.timestamp = new Date();

      // Add the decision
      await sessionService.addDecision(sessionId, decision);

      logger.info(`Decision submitted for session ${sessionId}`, {
        role: decision.role,
        action: decision.action
      });

      res.status(201).json({
        success: true,
        decision: {
          id: decision.id,
          sessionId: decision.sessionId,
          role: decision.role,
          action: decision.action,
          timestamp: decision.timestamp
        },
        message: 'Decision submitted successfully'
      });

    } catch (error) {
      logger.error('Error submitting decision:', error);
      res.status(500).json({ error: 'Failed to submit decision' });
    }
  }
);

export default router;
