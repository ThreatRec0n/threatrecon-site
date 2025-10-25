import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Enhanced Input Validation Schemas
 */
export const ValidationSchemas = {
  // User registration/login
  userRegistration: Joi.object({
    email: Joi.string().email().max(255).required(),
    name: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s]+$/).required(),
    password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/).required(),
    tenantId: Joi.string().uuid().optional()
  }),

  userLogin: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(1).max(128).required()
  }),

  // Scenario validation
  scenario: Joi.object({
    id: Joi.string().min(1).max(100).pattern(/^[a-zA-Z0-9_-]+$/).required(),
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().min(1).max(2000).required(),
    difficulty: Joi.string().valid('low', 'medium', 'high').required(),
    duration_minutes: Joi.number().integer().min(1).max(1440).required(), // Max 24 hours
    roles: Joi.array().items(Joi.string().min(1).max(50)).min(1).max(20).required(),
    injects: Joi.array().items(Joi.object({
      id: Joi.string().min(1).max(100).required(),
      time_offset_minutes: Joi.number().integer().min(0).required(),
      type: Joi.string().valid('text', 'sim_log', 'email', 'siem', 'file', 'manual').required(),
      target_roles: Joi.array().items(Joi.string()).min(1).required(),
      content: Joi.string().min(1).max(5000).required(),
      severity: Joi.string().valid('info', 'warning', 'critical').required(),
      required_actions: Joi.array().items(Joi.object({
        role: Joi.string().required(),
        action: Joi.string().min(1).max(500).required(),
        timeout_minutes: Joi.number().integer().min(1).max(1440).required(),
        penalty_points: Joi.number().integer().min(0).max(100).required(),
        bonus_points: Joi.number().integer().min(0).max(100).optional()
      })).optional(),
      branching: Joi.array().items(Joi.object({
        if: Joi.string().min(1).max(500).required(),
        goto: Joi.string().required(),
        else: Joi.string().optional()
      })).optional()
    })).min(1).max(50).required(),
    branching_rules: Joi.array().items(Joi.object({
      id: Joi.string().min(1).max(100).required(),
      condition: Joi.string().min(1).max(500).required(),
      true_goto: Joi.string().required(),
      false_goto: Joi.string().optional(),
      timeout_goto: Joi.string().optional(),
      timeout_minutes: Joi.number().integer().min(1).optional()
    })).optional(),
    end_conditions: Joi.array().items(Joi.object({
      type: Joi.string().valid('time_elapsed', 'all_injects_complete', 'manual_end').required(),
      minutes: Joi.number().integer().min(1).optional(),
      inject_ids: Joi.array().items(Joi.string()).optional()
    })).min(1).required(),
    metadata: Joi.object({
      author: Joi.string().min(1).max(100).optional(),
      version: Joi.string().min(1).max(20).optional(),
      tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional(),
      industry: Joi.string().min(1).max(50).optional(),
      compliance_frameworks: Joi.array().items(Joi.string()).max(10).optional(),
      mitre_attack_techniques: Joi.array().items(Joi.string()).max(20).optional(),
      estimated_setup_time: Joi.number().integer().min(0).max(120).optional(),
      facilitator_notes: Joi.string().max(1000).optional(),
      prerequisites: Joi.array().items(Joi.string().max(200)).max(10).optional()
    }).optional()
  }),

  // Session management
  sessionStart: Joi.object({
    scenarioId: Joi.string().min(1).max(100).required(),
    participants: Joi.array().items(Joi.object({
      role: Joi.string().min(1).max(50).required(),
      name: Joi.string().min(1).max(100).optional()
    })).min(1).max(20).required(),
    settings: Joi.object({
      difficulty: Joi.string().valid('low', 'medium', 'high').optional(),
      noiseLevel: Joi.number().integer().min(0).max(100).optional(),
      timeAcceleration: Joi.number().min(0.1).max(10).optional(),
      allowManualInjects: Joi.boolean().optional(),
      enableBranching: Joi.boolean().optional(),
      scoringEnabled: Joi.boolean().optional()
    }).optional(),
    piiConsent: Joi.boolean().required(),
    piiConsentTimestamp: Joi.number().integer().min(0).required()
  }),

  decision: Joi.object({
    action: Joi.string().min(1).max(200).required(),
    parameters: Joi.object().max(50).optional(),
    rationale: Joi.string().min(1).max(1000).required(),
    evidence_refs: Joi.array().items(Joi.string()).max(10).optional(),
    confidence: Joi.number().integer().min(1).max(10).optional()
  }),

  // Facilitator actions
  manualInject: Joi.object({
    type: Joi.string().valid('text', 'sim_log', 'email', 'siem', 'file', 'manual').required(),
    content: Joi.string().min(1).max(5000).required(),
    target_roles: Joi.array().items(Joi.string()).min(1).required(),
    severity: Joi.string().valid('info', 'warning', 'critical').optional(),
    injectId: Joi.string().min(1).max(100).optional()
  }),

  escalation: Joi.object({
    level: Joi.string().valid('info', 'warning', 'critical').required(),
    message: Joi.string().min(1).max(500).optional()
  }),

  // Export requests
  exportRequest: Joi.object({
    format: Joi.string().valid('pdf', 'json', 'markdown').required(),
    includeAuditTrail: Joi.boolean().optional(),
    includeDecisions: Joi.boolean().optional(),
    includeScores: Joi.boolean().optional()
  })
};

/**
 * Validation Middleware Factory
 */
export function validateRequest(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[property];
      
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: errorDetails,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(400).json({
          error: 'Validation failed',
          message: 'Request data is invalid',
          details: errorDetails
        });
        return;
      }

      // Replace the original data with validated and sanitized data
      req[property] = value;
      next();

    } catch (err) {
      logger.error('Validation middleware error:', err);
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

/**
 * File Upload Validation
 */
export function validateFileUpload(req: Request, res: Response, next: NextFunction): void {
  try {
    // Check if file is present
    if (!req.file && !req.files) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const file = req.file || (req.files as any)?.[0];
    
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      res.status(400).json({ 
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/json',
      'text/plain',
      'text/markdown',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Only JSON, text, markdown, and PDF files are allowed'
      });
      return;
    }

    // Validate file extension
    const allowedExtensions = ['.json', '.txt', '.md', '.pdf'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      res.status(400).json({ 
        error: 'Invalid file extension',
        message: 'Only .json, .txt, .md, and .pdf files are allowed'
      });
      return;
    }

    // Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);

    logger.info('File upload validated', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      ip: req.ip
    });

    next();

  } catch (error) {
    logger.error('File upload validation error:', error);
    res.status(500).json({ error: 'File validation error' });
  }
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 100); // Limit length
}

/**
 * API Key Validation Middleware
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide a valid API key in the X-API-Key header'
      });
      return;
    }

    // In a real implementation, validate against database
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      logger.warn('Invalid API key used', {
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.ip,
        path: req.path
      });
      
      res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
      return;
    }

    logger.info('API key validated', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      path: req.path
    });

    next();

  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(500).json({ error: 'API key validation error' });
  }
}

/**
 * Request Size Limiter
 */
export function requestSizeLimiter(maxSize: number = 1024 * 1024) { // 1MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      res.status(413).json({ 
        error: 'Request too large',
        message: `Request size must be less than ${maxSize} bytes`
      });
      return;
    }

    next();
  };
}

/**
 * IP Whitelist Middleware
 */
export function ipWhitelistMiddleware(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP not in whitelist', {
        ip: clientIP,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      
      res.status(403).json({ 
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource'
      });
      return;
    }

    next();
  };
}

/**
 * Request ID Middleware
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
