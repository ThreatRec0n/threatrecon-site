import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Facilitator middleware - ensures user has facilitator role
 */
export function facilitatorMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role.toLowerCase();
    const facilitatorRoles = ['facilitator', 'admin', 'instructor'];

    if (!facilitatorRoles.includes(userRole)) {
      res.status(403).json({ 
        error: 'Facilitator access required',
        message: 'Only facilitators, instructors, and administrators can access this resource',
        currentRole: req.user.role
      });
      return;
    }

    logger.info(`Facilitator access granted`, {
      userId: req.user.id,
      role: req.user.role,
      tenantId: req.tenantId,
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Error in facilitator middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Admin middleware - ensures user has admin role
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role.toLowerCase();

    if (userRole !== 'admin') {
      res.status(403).json({ 
        error: 'Admin access required',
        message: 'Only administrators can access this resource',
        currentRole: req.user.role
      });
      return;
    }

    logger.info(`Admin access granted`, {
      userId: req.user.id,
      role: req.user.role,
      tenantId: req.tenantId,
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Error in admin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Instructor middleware - ensures user has instructor or higher role
 */
export function instructorMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role.toLowerCase();
    const instructorRoles = ['instructor', 'admin'];

    if (!instructorRoles.includes(userRole)) {
      res.status(403).json({ 
        error: 'Instructor access required',
        message: 'Only instructors and administrators can access this resource',
        currentRole: req.user.role
      });
      return;
    }

    logger.info(`Instructor access granted`, {
      userId: req.user.id,
      role: req.user.role,
      tenantId: req.tenantId,
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Error in instructor middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
