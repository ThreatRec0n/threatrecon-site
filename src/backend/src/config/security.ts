/**
 * Security Configuration for ThreatRecon Platform
 * 
 * This file contains all security-related environment variables and settings
 * that must be configured for production deployment.
 */

export const SecurityConfig = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Password Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
  PASSWORD_REQUIRE_UPPERCASE: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  PASSWORD_REQUIRE_LOWERCASE: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
  PASSWORD_REQUIRE_NUMBERS: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
  PASSWORD_REQUIRE_SYMBOLS: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
  SESSION_RATE_LIMIT_MAX: parseInt(process.env.SESSION_RATE_LIMIT_MAX || '10'),

  // Session Security
  SESSION_SECRET: process.env.SESSION_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
  SESSION_COOKIE_SECURE: process.env.NODE_ENV === 'production',
  SESSION_COOKIE_HTTP_ONLY: true,
  SESSION_COOKIE_SAME_SITE: 'strict' as const,
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours

  // Data Retention
  SESSION_RETENTION_DAYS: parseInt(process.env.SESSION_RETENTION_DAYS || '30'),
  AUDIT_LOG_RETENTION_DAYS: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90'),
  AUTO_DELETE_ENABLED: process.env.AUTO_DELETE_ENABLED !== 'false',

  // API Security
  API_KEY_LENGTH: parseInt(process.env.API_KEY_LENGTH || '32'),
  API_KEY_PREFIX: process.env.API_KEY_PREFIX || 'tr_',
  VALID_API_KEYS: process.env.VALID_API_KEYS?.split(',') || [],

  // Database Security
  DB_SSL_ENABLED: process.env.NODE_ENV === 'production',
  DB_CONNECTION_POOL_MAX: parseInt(process.env.DB_CONNECTION_POOL_MAX || '20'),
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),

  // File Upload Security
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'application/json',
    'text/plain',
    'text/markdown',
    'application/pdf'
  ],
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://threatrecon.io',
    'https://www.threatrecon.io'
  ],
  CORS_CREDENTIALS: true,

  // Content Security Policy
  CSP_REPORT_URI: process.env.CSP_REPORT_URI,
  CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY === 'true',

  // Security Headers
  HSTS_MAX_AGE: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year
  HSTS_INCLUDE_SUBDOMAINS: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
  HSTS_PRELOAD: process.env.HSTS_PRELOAD !== 'false',

  // Logging Security
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_SENSITIVE_DATA: process.env.LOG_SENSITIVE_DATA === 'true',
  LOG_FILE_MAX_SIZE: process.env.LOG_FILE_MAX_SIZE || '10m',
  LOG_FILE_MAX_FILES: process.env.LOG_FILE_MAX_FILES || '5',

  // Monitoring and Alerting
  SECURITY_ALERT_EMAIL: process.env.SECURITY_ALERT_EMAIL,
  FAILED_LOGIN_THRESHOLD: parseInt(process.env.FAILED_LOGIN_THRESHOLD || '5'),
  ACCOUNT_LOCKOUT_DURATION: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '900000'), // 15 minutes

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'CHANGE_THIS_IN_PRODUCTION',
  ENCRYPTION_ALGORITHM: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',

  // AAR Signing
  SIGNING_KEY_ID: process.env.SIGNING_KEY_ID || 'default',
  SIGNING_SECRET: process.env.SIGNING_SECRET || 'CHANGE_THIS_IN_PRODUCTION',

  // IP Whitelisting (optional)
  IP_WHITELIST_ENABLED: process.env.IP_WHITELIST_ENABLED === 'true',
  IP_WHITELIST: process.env.IP_WHITELIST?.split(',') || [],

  // Feature Flags
  ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION !== 'false',
  ENABLE_PASSWORD_RESET: process.env.ENABLE_PASSWORD_RESET !== 'false',
  ENABLE_2FA: process.env.ENABLE_2FA === 'true',
  ENABLE_API_KEYS: process.env.ENABLE_API_KEYS !== 'false',

  // Development vs Production
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TESTING: process.env.NODE_ENV === 'test'
};

/**
 * Validate security configuration
 */
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for default/weak secrets in production
  if (SecurityConfig.IS_PRODUCTION) {
    if (SecurityConfig.JWT_SECRET === 'CHANGE_THIS_IN_PRODUCTION') {
      errors.push('JWT_SECRET must be set to a strong secret in production');
    }
    if (SecurityConfig.SESSION_SECRET === 'CHANGE_THIS_IN_PRODUCTION') {
      errors.push('SESSION_SECRET must be set to a strong secret in production');
    }
    if (SecurityConfig.ENCRYPTION_KEY === 'CHANGE_THIS_IN_PRODUCTION') {
      errors.push('ENCRYPTION_KEY must be set to a strong secret in production');
    }
    if (SecurityConfig.SIGNING_SECRET === 'CHANGE_THIS_IN_PRODUCTION') {
      errors.push('SIGNING_SECRET must be set to a strong secret in production');
    }
  }

  // Validate numeric values
  if (SecurityConfig.BCRYPT_ROUNDS < 10) {
    errors.push('BCRYPT_ROUNDS should be at least 10 for security');
  }

  if (SecurityConfig.PASSWORD_MIN_LENGTH < 8) {
    errors.push('PASSWORD_MIN_LENGTH should be at least 8 characters');
  }

  if (SecurityConfig.RATE_LIMIT_MAX_REQUESTS > 1000) {
    errors.push('RATE_LIMIT_MAX_REQUESTS should not exceed 1000');
  }

  // Validate file upload settings
  if (SecurityConfig.MAX_FILE_SIZE > 50 * 1024 * 1024) { // 50MB
    errors.push('MAX_FILE_SIZE should not exceed 50MB');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get security recommendations for production
 */
export function getSecurityRecommendations(): string[] {
  const recommendations: string[] = [];

  if (!SecurityConfig.IS_PRODUCTION) {
    recommendations.push('This is a development configuration. Review all settings before production deployment.');
  }

  if (SecurityConfig.SESSION_RETENTION_DAYS > 90) {
    recommendations.push('Consider reducing SESSION_RETENTION_DAYS to comply with data protection regulations');
  }

  if (!SecurityConfig.ENABLE_2FA) {
    recommendations.push('Consider enabling 2FA for enhanced security');
  }

  if (SecurityConfig.CORS_ORIGINS.includes('*')) {
    recommendations.push('Avoid using wildcard (*) in CORS_ORIGINS for production');
  }

  if (!SecurityConfig.SECURITY_ALERT_EMAIL) {
    recommendations.push('Set SECURITY_ALERT_EMAIL for security incident notifications');
  }

  return recommendations;
}

export default SecurityConfig;
