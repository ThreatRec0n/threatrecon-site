import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { SecurityConfig } from '../config/security';

/**
 * Authentication middleware
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    try {
      const decoded = jwt.verify(token, SecurityConfig.JWT_SECRET) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email || '',
        name: decoded.name || '',
        role: decoded.role,
        tenantId: decoded.tenantId,
        permissions: decoded.permissions || [],
        createdAt: decoded.createdAt || new Date(),
        updatedAt: decoded.updatedAt || new Date()
      };
      req.tenantId = decoded.tenantId;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }

  } catch (error) {
    logger.error('Error in auth middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Require specific role middleware
 */
export function requireRole(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Error in requireRole middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Require specific permission middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // In a real implementation, you'd check user permissions
      // For now, we'll allow all authenticated users
      next();

    } catch (error) {
      logger.error('Error in requirePermission middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Tenant isolation middleware
 */
export function tenantIsolationMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Set tenant ID from user or default to 'public'
    if (req.user?.tenantId) {
      req.tenantId = req.user.tenantId;
    } else {
      req.tenantId = 'public';
    }

    next();

  } catch (error) {
    logger.error('Error in tenant isolation middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Session ownership middleware
 */
export function sessionOwnershipMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID required' });
      return;
    }

    // In a real implementation, you'd verify the user owns this session
    // For now, we'll allow all authenticated users
    next();

  } catch (error) {
    logger.error('Error in session ownership middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Tenant middleware (alias for tenantIsolationMiddleware)
 */
export const tenantMiddleware = tenantIsolationMiddleware;
