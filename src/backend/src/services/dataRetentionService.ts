import { Pool } from 'pg';

export interface RetentionPolicy {
  retentionDays: number;
  autoDeleteEnabled: boolean;
  maxRetentionDays: number;
}

export interface PurgeResult {
  success: boolean;
  sessionsPurged: number;
  error?: string;
}

export class DataRetentionService {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/threatrecon'
    });
  }

  async getRetentionPolicy(): Promise<RetentionPolicy> {
    const retentionDays = parseInt(process.env.SESSION_RETENTION_DAYS || '7');
    const maxRetentionDays = 30; // Maximum allowed for public SaaS
    
    return {
      retentionDays,
      autoDeleteEnabled: true,
      maxRetentionDays
    };
  }

  async getSessionsForPurge(): Promise<string[]> {
    const policy = await this.getRetentionPolicy();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    try {
      const result = await this.db.query(
        `SELECT id FROM sessions 
         WHERE created_at < $1 
         AND status != 'purged' 
         AND tenant_id = 'public'`,
        [cutoffDate]
      );

      return result.rows.map(row => row.id);
    } catch (error) {
      console.error('Error getting sessions for purge:', error);
      return [];
    }
  }

  async purgeSession(sessionId: string): Promise<boolean> {
    try {
      // Mark session as purged
      await this.db.query(
        'UPDATE sessions SET status = $1, purged_at = $2 WHERE id = $3',
        ['purged', new Date(), sessionId]
      );

      // Delete associated events
      await this.db.query(
        'DELETE FROM session_events WHERE session_id = $1',
        [sessionId]
      );

      // Delete audit logs
      await this.db.query(
        'DELETE FROM audit_logs WHERE session_id = $1',
        [sessionId]
      );

      // Note: AAR exports would be deleted from file storage in production
      console.log(`✅ Session ${sessionId} purged successfully`);
      return true;
    } catch (error) {
      console.error(`Error purging session ${sessionId}:`, error);
      return false;
    }
  }

  async purgeExpiredSessions(): Promise<PurgeResult> {
    try {
      const sessionsToPurge = await this.getSessionsForPurge();
      let sessionsPurged = 0;

      for (const sessionId of sessionsToPurge) {
        const success = await this.purgeSession(sessionId);
        if (success) {
          sessionsPurged++;
        }
      }

      return {
        success: true,
        sessionsPurged
      };
    } catch (error) {
      return {
        success: false,
        sessionsPurged: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async close(): Promise<void> {
    await this.db.end();
  }
}
