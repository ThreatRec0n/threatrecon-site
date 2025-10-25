import { logger } from '../utils/logger';
import { Inject, DrillSession } from '../shared/types';

export class OrchestrationService {
  private queuedInjects: Map<string, Inject[]> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout[]> = new Map();

  constructor() {
    // Initialize with empty orchestration state
  }

  /**
   * Start session orchestration
   */
  async startSession(sessionId: string, scenario: any): Promise<void> {
    try {
      // Clear any existing timers
      this.clearSessionTimers(sessionId);

      // Queue all injects from the scenario
      const injects = scenario.injects || [];
      this.queuedInjects.set(sessionId, [...injects]);

      // Schedule injects based on their time offsets
      const timers: NodeJS.Timeout[] = [];

      injects.forEach((inject: Inject) => {
        if (inject.time_offset_minutes && inject.time_offset_minutes > 0) {
          const delayMs = inject.time_offset_minutes * 60 * 1000; // Convert minutes to milliseconds
          
          const timer = setTimeout(() => {
            this.deliverInject(sessionId, inject);
          }, delayMs);

          timers.push(timer);
        } else if (inject.time_offset_minutes === 0) {
          // Immediate inject
          this.deliverInject(sessionId, inject);
        }
      });

      this.activeTimers.set(sessionId, timers);

      logger.info(`Session orchestration started: ${sessionId}`, {
        totalInjects: injects.length,
        scheduledTimers: timers.length
      });

    } catch (error) {
      logger.error('Error starting session orchestration:', error);
      throw error;
    }
  }

  /**
   * Pause session orchestration
   */
  async pauseSession(sessionId: string): Promise<void> {
    try {
      const timers = this.activeTimers.get(sessionId) || [];
      
      // Clear all active timers
      timers.forEach(timer => clearTimeout(timer));
      this.activeTimers.set(sessionId, []);

      logger.info(`Session orchestration paused: ${sessionId}`);

    } catch (error) {
      logger.error('Error pausing session orchestration:', error);
      throw error;
    }
  }

  /**
   * Resume session orchestration
   */
  async resumeSession(sessionId: string): Promise<void> {
    try {
      // For simplicity, we'll just log that orchestration resumed
      // In a real implementation, you'd need to recalculate remaining time
      // and reschedule timers based on elapsed time
      
      logger.info(`Session orchestration resumed: ${sessionId}`);

    } catch (error) {
      logger.error('Error resuming session orchestration:', error);
      throw error;
    }
  }

  /**
   * Send a manual inject
   */
  async sendManualInject(sessionId: string, inject: Inject): Promise<void> {
    try {
      // Add manual inject to queued injects
      const queued = this.queuedInjects.get(sessionId) || [];
      queued.push(inject);
      this.queuedInjects.set(sessionId, queued);

      // Deliver immediately
      this.deliverInject(sessionId, inject);

      logger.info(`Manual inject sent to session ${sessionId}`, {
        injectId: inject.id,
        type: inject.type,
        targetRoles: inject.target_roles
      });

    } catch (error) {
      logger.error('Error sending manual inject:', error);
      throw error;
    }
  }

  /**
   * Broadcast message to all participants in a session
   */
  broadcastToSession(sessionId: string, event: string, data: any): void {
    try {
      // In a real implementation, this would use Socket.IO to broadcast
      // For now, we'll just log the broadcast
      logger.info(`Broadcasting to session ${sessionId}`, {
        event,
        data
      });

    } catch (error) {
      logger.error('Error broadcasting to session:', error);
    }
  }

  /**
   * Get queued injects for a session
   */
  async getQueuedInjects(sessionId: string): Promise<Inject[]> {
    try {
      return this.queuedInjects.get(sessionId) || [];

    } catch (error) {
      logger.error('Error getting queued injects:', error);
      return [];
    }
  }

  /**
   * Enqueue purge job
   */
  async enqueuePurgeJob(sessionId: string): Promise<void> {
    try {
      // In a real implementation, this would enqueue a BullMQ job
      logger.info(`Purge job enqueued for session: ${sessionId}`);

    } catch (error) {
      logger.error('Error enqueuing purge job:', error);
      throw error;
    }
  }

  /**
   * Deliver an inject to participants
   */
  private deliverInject(sessionId: string, inject: Inject): void {
    try {
      // In a real implementation, this would:
      // 1. Send the inject to target participants via Socket.IO
      // 2. Update session state
      // 3. Handle branching logic
      // 4. Update scoring

      logger.info(`Inject delivered to session ${sessionId}`, {
        injectId: inject.id,
        type: inject.type,
        content: inject.content.substring(0, 100) + '...',
        targetRoles: inject.target_roles
      });

    } catch (error) {
      logger.error('Error delivering inject:', error);
    }
  }

  /**
   * Clear all timers for a session
   */
  private clearSessionTimers(sessionId: string): void {
    try {
      const timers = this.activeTimers.get(sessionId) || [];
      timers.forEach(timer => clearTimeout(timer));
      this.activeTimers.delete(sessionId);

    } catch (error) {
      logger.error('Error clearing session timers:', error);
    }
  }

  /**
   * Stop session orchestration
   */
  async stopSession(sessionId: string): Promise<void> {
    try {
      this.clearSessionTimers(sessionId);
      this.queuedInjects.delete(sessionId);

      logger.info(`Session orchestration stopped: ${sessionId}`);

    } catch (error) {
      logger.error('Error stopping session orchestration:', error);
      throw error;
    }
  }
}
