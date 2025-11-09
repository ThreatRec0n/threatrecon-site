// Security utilities for input validation, sanitization, and anti-cheat measures

/**
 * Validates and sanitizes IP addresses
 */
export function validateIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Limit length
}

/**
 * Validates alert classification values
 */
export function validateAlertClassification(value: string): boolean {
  const validClassifications = [
    'true-positive',
    'false-positive',
    'true-negative',
    'false-negative',
    'unclassified'
  ];
  return validClassifications.includes(value);
}


// Classic game mode validation functions removed - platform now uses SOC Simulation Mode only

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Classic game mode scenario validation removed - platform now uses SOC Simulation Mode only

/**
 * Sanitizes search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  // Remove potentially dangerous characters but allow normal search
  return query
    .replace(/[<>'"`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 500); // Limit length
}

/**
 * Validates time range
 */
export function validateTimeRange(range: string): boolean {
  const validRanges = ['15m', '1h', '24h', '7d'];
  return validRanges.includes(range);
}

