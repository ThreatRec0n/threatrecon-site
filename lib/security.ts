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

/**
 * Validates difficulty level
 */
export function validateDifficultyLevel(value: string): boolean {
  const validLevels = ['grasshopper', 'beginner', 'intermediate', 'advanced'];
  return validLevels.includes(value);
}

/**
 * Creates a hash of game state for integrity checking
 */
export function hashGameState(state: any): string {
  const str = JSON.stringify(state);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validates game result integrity
 */
export function validateGameResult(result: any, expectedHash?: string): boolean {
  if (!result || typeof result !== 'object') return false;
  
  // Validate required fields
  if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) return false;
  if (typeof result.timeSpent !== 'number' || result.timeSpent < 0) return false;
  if (!Array.isArray(result.foundIPs)) return false;
  
  // Validate IPs in foundIPs
  for (const ip of result.foundIPs) {
    if (!validateIP(ip)) return false;
  }
  
  // If hash provided, validate integrity
  if (expectedHash) {
    const currentHash = hashGameState({
      score: result.score,
      foundIPs: result.foundIPs.sort(),
      timeSpent: result.timeSpent,
    });
    return currentHash === expectedHash;
  }
  
  return true;
}

/**
 * Detects if DevTools are open (basic detection)
 */
export function detectDevTools(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check console object
  let devtools = false;
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      devtools = true;
      return 'devtools-detector';
    }
  });
  
  // Check window dimensions (DevTools often changes this)
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  
  return devtools || widthThreshold || heightThreshold;
}

/**
 * Validates timestamp to prevent time manipulation
 */
export function validateTimestamp(timestamp: number, startTime: number, maxDuration: number): boolean {
  const now = Date.now();
  const elapsed = (now - startTime) / 1000; // Convert to seconds
  
  // Check if elapsed time is reasonable (within 10% tolerance)
  const expectedMax = maxDuration * 1.1;
  return elapsed >= 0 && elapsed <= expectedMax;
}

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

/**
 * Validates scenario data structure
 */
export function validateScenario(scenario: any): boolean {
  if (!scenario || typeof scenario !== 'object') return false;
  
  // Required fields
  if (!scenario.id || typeof scenario.id !== 'string') return false;
  if (!scenario.difficulty || !validateDifficultyLevel(scenario.difficulty)) return false;
  if (!Array.isArray(scenario.alerts)) return false;
  
  // Validate alerts
  for (const alert of scenario.alerts) {
    if (!alert.id || typeof alert.id !== 'string') return false;
    if (!validateAlertClassification(alert.correctClassification || 'unclassified')) return false;
    if (alert.dstIp && !validateIP(alert.dstIp)) return false;
  }
  
  return true;
}

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

