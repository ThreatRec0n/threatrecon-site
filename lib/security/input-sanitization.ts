/**
 * Comprehensive input sanitization and validation
 * Prevents XSS, SQL injection, and other security threats
 */

// Common bad words list (basic - can be expanded)
const BAD_WORDS = [
  // Profanity (common words)
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
  // Hacking-related terms that could be malicious
  'sql injection', 'xss', '<script>', 'javascript:', 'onerror=',
  'onclick=', 'onload=', 'eval(', 'exec(', 'system(',
  // SQL injection patterns
  "'; drop table", "'; delete from", "'; update", "'; insert into",
  "union select", "or 1=1", "--", "/*", "*/",
  // Command injection patterns
  '; rm -rf', '; cat /etc/passwd', '| nc', '&&', '||',
  // XSS patterns
  '<iframe', '<img src=x', '<svg onload', '<body onload',
  // Other dangerous patterns
  'document.cookie', 'localStorage.clear', 'sessionStorage',
  'window.location', 'location.href', 'eval(',
];

// Suspicious patterns that might indicate hacking attempts
const SUSPICIOUS_PATTERNS = [
  /<script[\s\S]*?>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /exec\s*\(/gi,
  /system\s*\(/gi,
  /union\s+select/gi,
  /;\s*(drop|delete|update|insert|alter|create|truncate)\s+/gi,
  /--[\s\S]*$/gm,
  /\/\*[\s\S]*?\*\//g,
  /<iframe[\s\S]*?>/gi,
  /<img[\s\S]*?onerror/gi,
  /<svg[\s\S]*?onload/gi,
  /document\.(cookie|write|location)/gi,
  /window\.(location|eval)/gi,
  /localStorage\.(clear|removeItem)/gi,
  /sessionStorage\.(clear|removeItem)/gi,
];

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // Remove suspicious patterns
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove HTML tags (but allow basic formatting)
  sanitized = sanitized
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length
  sanitized = sanitized.trim().slice(0, 10000);

  return sanitized;
}

/**
 * Checks if input contains bad words
 */
export function containsBadWords(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const lowerInput = input.toLowerCase();
  return BAD_WORDS.some(word => lowerInput.includes(word));
}

/**
 * Checks if input contains suspicious hacking patterns
 */
export function containsSuspiciousPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Validates input for security threats
 * Returns { valid: boolean, reason?: string }
 */
export function validateInput(input: string): { valid: boolean; reason?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, reason: 'Input is required' };
  }

  if (input.length > 10000) {
    return { valid: false, reason: 'Input is too long (max 10,000 characters)' };
  }

  if (containsBadWords(input)) {
    return { valid: false, reason: 'Input contains inappropriate content' };
  }

  if (containsSuspiciousPatterns(input)) {
    return { valid: false, reason: 'Input contains potentially malicious content' };
  }

  return { valid: true };
}

/**
 * Sanitizes and validates input in one step
 * Returns { sanitized: string, valid: boolean, reason?: string }
 */
export function sanitizeAndValidate(input: string): {
  sanitized: string;
  valid: boolean;
  reason?: string;
} {
  const validation = validateInput(input);
  if (!validation.valid) {
    return {
      sanitized: '',
      valid: false,
      reason: validation.reason,
    };
  }

  const sanitized = sanitizeInput(input);
  return {
    sanitized,
    valid: true,
  };
}

