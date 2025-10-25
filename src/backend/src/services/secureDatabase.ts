import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

/**
 * Secure Database Connection Pool
 */
export class SecureDatabase {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'threatrecon',
      user: process.env.DB_USER || 'threatrecon',
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
    });

    this.pool.on('error', (err) => {
      logger.error('Database pool error:', err);
    });

    this.pool.on('connect', () => {
      logger.info('Database connection established');
      this.isConnected = true;
    });

    this.pool.on('remove', () => {
      logger.info('Database connection removed from pool');
    });
  }

  /**
   * Execute a parameterized query safely
   */
  async query(text: string, params?: any[]): Promise<any> {
    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text.substring(0, 100) + '...',
        duration: `${duration}ms`,
        rowCount: result.rowCount
      });

      return result;

    } catch (error) {
      logger.error('Database query error:', {
        query: text.substring(0, 100) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
        params: params ? params.length : 0
      });
      throw error;
    }
  }

  /**
   * Execute a transaction safely
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;

    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    logger.info('Database connection pool closed');
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }
}

/**
 * SQL Injection Prevention Utilities
 */
export class SQLSecurity {
  /**
   * Sanitize identifier (table/column names)
   */
  static sanitizeIdentifier(identifier: string): string {
    // Only allow alphanumeric characters and underscores
    return identifier.replace(/[^a-zA-Z0-9_]/g, '');
  }

  /**
   * Validate and sanitize WHERE clause parameters
   */
  static sanitizeWhereClause(whereClause: Record<string, any>): { query: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [column, value] of Object.entries(whereClause)) {
      const sanitizedColumn = this.sanitizeIdentifier(column);
      
      if (Array.isArray(value)) {
        // Handle IN clause
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${sanitizedColumn} IN (${placeholders})`);
        params.push(...value);
      } else if (value === null) {
        conditions.push(`${sanitizedColumn} IS NULL`);
      } else {
        conditions.push(`${sanitizedColumn} = $${paramIndex++}`);
        params.push(value);
      }
    }

    return {
      query: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  /**
   * Validate ORDER BY clause
   */
  static sanitizeOrderBy(orderBy: string): string {
    // Only allow alphanumeric characters, underscores, and ASC/DESC
    const sanitized = orderBy.replace(/[^a-zA-Z0-9_\s,]/g, '');
    
    // Validate ASC/DESC keywords
    if (!/^[a-zA-Z0-9_]+(\s+(ASC|DESC))?(\s*,\s*[a-zA-Z0-9_]+(\s+(ASC|DESC))?)*$/i.test(sanitized)) {
      throw new Error('Invalid ORDER BY clause');
    }

    return sanitized;
  }

  /**
   * Validate LIMIT and OFFSET values
   */
  static sanitizeLimitOffset(limit?: number, offset?: number): { limitClause: string; params: any[] } {
    const params: any[] = [];
    let limitClause = '';

    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 0 || limit > 1000) {
        throw new Error('Invalid LIMIT value');
      }
      limitClause += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    if (offset !== undefined) {
      if (!Number.isInteger(offset) || offset < 0) {
        throw new Error('Invalid OFFSET value');
      }
      limitClause += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }

    return { limitClause, params };
  }
}

/**
 * Database Audit Logger
 */
export class DatabaseAuditLogger {
  private db: SecureDatabase;

  constructor(database: SecureDatabase) {
    this.db = database;
  }

  /**
   * Log database access
   */
  async logAccess(
    userId: string,
    tenantId: string,
    action: string,
    resource: string,
    metadata?: any
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, resource, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, tenantId, action, resource, JSON.stringify(metadata || {})]
      );

    } catch (error) {
      logger.error('Failed to log database access:', error);
    }
  }

  /**
   * Log data modification
   */
  async logModification(
    userId: string,
    tenantId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    recordId: string,
    oldData?: any,
    newData?: any
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO data_audit_logs (user_id, tenant_id, action, table_name, record_id, old_data, new_data, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          userId,
          tenantId,
          action,
          table,
          recordId,
          oldData ? JSON.stringify(oldData) : null,
          newData ? JSON.stringify(newData) : null
        ]
      );

    } catch (error) {
      logger.error('Failed to log data modification:', error);
    }
  }
}

/**
 * Database Connection Health Check
 */
export class DatabaseHealthCheck {
  private db: SecureDatabase;

  constructor(database: SecureDatabase) {
    this.db = database;
  }

  /**
   * Perform health check
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    latency: number;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      await this.db.query('SELECT 1');
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        latency
      };

    } catch (error) {
      const latency = Date.now() - start;
      
      return {
        healthy: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    activeConnections: number;
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  }> {
    try {
      const result = await this.db.query(`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'waiting') as waiting_clients
      `);

      return result.rows[0];

    } catch (error) {
      logger.error('Failed to get database stats:', error);
      return {
        activeConnections: 0,
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0
      };
    }
  }
}

// Export singleton instance
export const secureDatabase = new SecureDatabase();
export const databaseAuditLogger = new DatabaseAuditLogger(secureDatabase);
export const databaseHealthCheck = new DatabaseHealthCheck(secureDatabase);
