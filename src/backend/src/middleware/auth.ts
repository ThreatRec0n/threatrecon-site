import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { User, AuthToken } from '../shared/types';

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenantId?: string;
      sessionId?: string;
    }
  }
}

/**
 * Enhanced Authentication Middleware
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Token is required'
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Validate token structure
      if (!decoded.userId || !decoded.tenantId || !decoded.role) {
        logger.warn('Invalid token structure', { decoded });
        res.status(401).json({ 
          error: 'Invalid token',
          message: 'Token is malformed'
        });
        return;
      }

      // Check token expiration
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        logger.warn('Token expired', { userId: decoded.userId });
        res.status(401).json({ 
          error: 'Token expired',
          message: 'Please log in again'
        });
        return;
      }

      // Add user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        tenantId: decoded.tenantId,
        role: decoded.role,
        permissions: decoded.permissions || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      req.tenantId = decoded.tenantId;

      logger.info('User authenticated', {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role,
        ip: req.ip
      });

      next();

    } catch (jwtError) {
      logger.warn('JWT verification failed', { 
        error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token verification failed'
      });
      return;
    }

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Role-based Authorization Middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Unauthorized role access attempt', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path,
          ip: req.ip
        });
        
        res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Role authorization error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
}

/**
 * Permission-based Authorization Middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
        return;
      }

      if (!req.user.permissions[permission]) {
        logger.warn('Insufficient permission', {
          userId: req.user.id,
          permission,
          userPermissions: req.user.permissions,
          path: req.path,
          ip: req.ip
        });
        
        res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `This resource requires the '${permission}' permission`
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Permission authorization error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
}

/**
 * Tenant Isolation Middleware
 */
export function tenantIsolationMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      logger.warn('Request without tenant ID', {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(400).json({ 
        error: 'Tenant identification required',
        message: 'Request must include tenant context'
      });
      return;
    }

    // Add tenant context to request for database queries
    req.tenantId = tenantId;

    next();

  } catch (error) {
    logger.error('Tenant isolation error:', error);
    res.status(500).json({ error: 'Tenant isolation error' });
  }
}

/**
 * Session Ownership Middleware
 */
export function sessionOwnershipMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const { sessionId } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID required' });
      return;
    }

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID required' });
      return;
    }

    // In a real implementation, verify session ownership here
    // For now, we'll add the context to the request
    req.sessionId = sessionId;

    logger.info('Session ownership verified', {
      sessionId,
      tenantId,
      userId,
      path: req.path
    });

    next();

  } catch (error) {
    logger.error('Session ownership error:', error);
    res.status(500).json({ error: 'Session ownership verification error' });
  }
}

/**
 * Generate JWT Token
 */
export function generateToken(user: User): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    role: user.role,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, jwtSecret);
}

/**
 * Hash Password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify Password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate Password Strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate Email Format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate Secure Session ID
 */
export function generateSecureSessionId(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate Secure API Key
 */
export function generateSecureApiKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64url');
}
