import { logger } from '../utils/logger';
import { DrillSession, SessionEvent, Decision } from '../shared/types';

export class SessionService {
  private sessions: Map<string, DrillSession> = new Map();
  private decisions: Map<string, Decision[]> = new Map();

  constructor() {
    // Initialize with empty session storage
  }

  /**
   * Create a new drill session
   */
  async createSession(sessionData: {
    scenarioId: string;
    participants: Array<{ role: string; name?: string }>;
    settings?: any;
    tenantId: string;
  }): Promise<DrillSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: DrillSession = {
        id: sessionId,
        scenarioId: sessionData.scenarioId,
        tenantId: sessionData.tenantId,
        status: 'pending',
        startedAt: null,
        endedAt: null,
        participants: sessionData.participants.map(p => ({
          role: p.role,
          name: p.name || `Participant_${p.role}`,
          joinedAt: new Date(),
          lastActivity: new Date()
        })),
        events: [],
        scores: {},
        settings: sessionData.settings || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.sessions.set(sessionId, session);
      this.decisions.set(sessionId, []);

      logger.info(`Session created: ${sessionId}`, {
        scenarioId: sessionData.scenarioId,
        participantCount: sessionData.participants.length,
        tenantId: sessionData.tenantId
      });

      return session;

    } catch (error) {
      logger.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string, tenantId: string): Promise<DrillSession | null> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session || session.tenantId !== tenantId) {
        return null;
      }

      return session;

    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionId: string, status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled'): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = status;
      session.updatedAt = new Date();

      if (status === 'active' && !session.startedAt) {
        session.startedAt = new Date();
      }

      this.sessions.set(sessionId, session);

      logger.info(`Session ${sessionId} status updated to ${status}`);

    } catch (error) {
      logger.error('Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Set session end time
   */
  async setSessionEndTime(sessionId: string, endTime: Date): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.endedAt = endTime;
      session.updatedAt = new Date();

      this.sessions.set(sessionId, session);

      logger.info(`Session ${sessionId} end time set to ${endTime.toISOString()}`);

    } catch (error) {
      logger.error('Error setting session end time:', error);
      throw error;
    }
  }

  /**
   * Update session severity
   */
  async updateSessionSeverity(sessionId: string, severity: 'info' | 'warning' | 'critical'): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.settings) {
        session.settings = {};
      }
      session.settings.currentSeverity = severity;
      session.updatedAt = new Date();

      this.sessions.set(sessionId, session);

      logger.info(`Session ${sessionId} severity updated to ${severity}`);

    } catch (error) {
      logger.error('Error updating session severity:', error);
      throw error;
    }
  }

  /**
   * Soft delete session
   */
  async softDeleteSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'cancelled';
      session.updatedAt = new Date();

      this.sessions.set(sessionId, session);

      logger.info(`Session ${sessionId} soft deleted`);

    } catch (error) {
      logger.error('Error soft deleting session:', error);
      throw error;
    }
  }

  /**
   * Add a decision to the session
   */
  async addDecision(sessionId: string, decision: Decision): Promise<void> {
    try {
      const decisions = this.decisions.get(sessionId) || [];
      decisions.push(decision);
      this.decisions.set(sessionId, decisions);

      // Update participant last activity
      const session = this.sessions.get(sessionId);
      if (session) {
        const participant = session.participants.find(p => p.role === decision.role);
        if (participant) {
          participant.lastActivity = new Date();
          this.sessions.set(sessionId, session);
        }
      }

      logger.info(`Decision added to session ${sessionId}`, {
        role: decision.role,
        action: decision.action
      });

    } catch (error) {
      logger.error('Error adding decision:', error);
      throw error;
    }
  }

  /**
   * Get recent decisions for a session
   */
  async getRecentDecisions(sessionId: string, limit: number = 50): Promise<Decision[]> {
    try {
      const decisions = this.decisions.get(sessionId) || [];
      return decisions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting recent decisions:', error);
      return [];
    }
  }

  /**
   * Add an event to the session
   */
  async addEvent(sessionId: string, event: SessionEvent): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.events.push(event);
      session.updatedAt = new Date();

      this.sessions.set(sessionId, session);

      logger.info(`Event added to session ${sessionId}`, {
        type: event.type,
        timestamp: event.timestamp
      });

    } catch (error) {
      logger.error('Error adding event:', error);
      throw error;
    }
  }

  /**
   * Get sessions for purge (older than retention days)
   */
  async getSessionsForPurge(retentionDays: number = 30): Promise<string[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const sessionsToPurge: string[] = [];

      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.createdAt < cutoffDate && session.status !== 'cancelled') {
          sessionsToPurge.push(sessionId);
        }
      }

      return sessionsToPurge;

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
      this.sessions.delete(sessionId);
      this.decisions.delete(sessionId);

      logger.info(`Session ${sessionId} purged successfully`);

      return true;

    } catch (error) {
      logger.error('Error purging session:', error);
      return false;
    }
  }
}
