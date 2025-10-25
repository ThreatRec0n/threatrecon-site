import { Worker, Job, Queue } from 'bullmq';
import { DataRetentionService } from '../services/dataRetentionService';
import { logger } from '../utils/logger';

export class CleanupWorker {
  private worker: Worker;
  private retentionService: DataRetentionService;

  constructor(connection: any) {
    this.retentionService = new DataRetentionService();
    
    this.worker = new Worker('cleanup-expired-sessions', async (job: Job) => {
      await this.processCleanupJob(job);
    }, {
      connection,
      concurrency: 1, // Process one cleanup job at a time
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 5 }
    });

    this.worker.on('completed', (job) => {
      logger.info(`Cleanup job completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Cleanup job failed: ${job?.id}`, err);
    });

    logger.info('Cleanup worker initialized');
  }

  /**
   * Process cleanup job
   */
  private async processCleanupJob(job: Job): Promise<void> {
    try {
      const { sessionId, type } = job.data;

      logger.info(`Processing cleanup job: ${type} for session ${sessionId}`);

      switch (type) {
        case 'purge-session':
          await this.purgeSession(sessionId);
          break;
        case 'cleanup-expired':
          await this.cleanupExpiredSessions();
          break;
        default:
          logger.warn(`Unknown cleanup job type: ${type}`);
      }

      logger.info(`Cleanup job completed successfully: ${job.id}`);

    } catch (error) {
      logger.error(`Cleanup job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Purge a specific session
   */
  private async purgeSession(sessionId: string): Promise<void> {
    try {
      logger.info(`Starting purge for session: ${sessionId}`);

      // Purge session data
      const result = await this.retentionService.purgeSession(sessionId);
      
      if (result.success) {
        logger.info(`Session ${sessionId} purged successfully`, {
          sessionsPurged: result.sessionsPurged,
          aarsPurged: result.aarsPurged,
          auditLogsPurged: result.auditLogsPurged
        });
      } else {
        logger.error(`Failed to purge session ${sessionId}`, { errors: result.errors });
        throw new Error(`Failed to purge session ${sessionId}: ${result.errors.join(', ')}`);
      }

    } catch (error) {
      logger.error(`Error purging session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup all expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      logger.info('Starting cleanup of expired sessions');

      // Get sessions eligible for purge
      const sessionsToPurge = await this.retentionService.getSessionsForPurge();
      
      logger.info(`Found ${sessionsToPurge.length} sessions eligible for purge`);

      let purgedCount = 0;
      let failedCount = 0;

      for (const session of sessionsToPurge) {
        try {
          await this.purgeSession(session.id);
          purgedCount++;
        } catch (error) {
          logger.error(`Failed to purge session ${session.id}:`, error);
          failedCount++;
        }
      }

      logger.info(`Cleanup completed: ${purgedCount} purged, ${failedCount} failed`);

      // Log cleanup statistics
      await this.logCleanupStats({
        totalSessions: sessionsToPurge.length,
        purgedCount,
        failedCount,
        timestamp: new Date().toISOString(),
        retentionDays: this.retentionService.getRetentionPolicy().sessionRetentionDays
      });

    } catch (error) {
      logger.error('Error in cleanup of expired sessions:', error);
      throw error;
    }
  }

  /**
   * Log cleanup statistics
   */
  private async logCleanupStats(stats: CleanupStats): Promise<void> {
    try {
      // In a real implementation, this would store stats in a database
      logger.info('Cleanup statistics', stats);
      
      // Could also send to monitoring service
      // await this.monitoringService.recordCleanupStats(stats);

    } catch (error) {
      logger.error('Error logging cleanup stats:', error);
    }
  }

  /**
   * Schedule regular cleanup
   */
  scheduleRegularCleanup(queue: Queue): void {
    // Schedule cleanup every 24 hours
    queue.add('cleanup-expired-sessions', 
      { type: 'cleanup-expired' },
      {
        repeat: { pattern: '0 2 * * *' }, // 2 AM daily
        jobId: 'regular-cleanup'
      }
    );

    logger.info('Regular cleanup scheduled for 2 AM daily');
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    try {
      await this.worker.close();
      logger.info('Cleanup worker stopped');
    } catch (error) {
      logger.error('Error stopping cleanup worker:', error);
    }
  }
}

/**
 * Session Purge Job Types
 */
export interface PurgeJobData {
  sessionId: string;
  type: 'purge-session' | 'cleanup-expired';
  tenantId?: string;
  reason?: string;
}

/**
 * Cleanup Statistics
 */
export interface CleanupStats {
  totalSessions: number;
  purgedCount: number;
  failedCount: number;
  timestamp: string;
  retentionDays: number;
}
