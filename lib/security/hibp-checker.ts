/**
 * Have I Been Pwned Password Checker
 * 
 * Uses k-anonymity model to check passwords against HIBP database
 * without sending the full password.
 * 
 * Reference: https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
 */

const HIBP_API_URL = 'https://api.pwnedpasswords.com/range/';

/**
 * Hash password using SHA-1 (required by HIBP API)
 */
async function sha1Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Check if password appears in HIBP database using k-anonymity
 * Returns the count of breaches (0 if not found)
 */
export async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    // Hash the password
    const hash = await sha1Hash(password);
    
    // Extract first 5 characters (prefix) and remaining (suffix)
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    // Query HIBP API with prefix only (k-anonymity)
    const response = await fetch(`${HIBP_API_URL}${prefix}`, {
      headers: {
        'User-Agent': 'ThreatRecon-Security-Checker/1.0',
      },
    });
    
    if (!response.ok) {
      // If API fails, don't block user (fail open)
      console.warn('HIBP API request failed, allowing password');
      return { breached: false, count: 0 };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our suffix appears in the results
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return { 
          breached: true, 
          count: parseInt(count.trim(), 10) || 0 
        };
      }
    }
    
    return { breached: false, count: 0 };
  } catch (error) {
    // Fail open - don't block users if service is unavailable
    console.error('Error checking password with HIBP:', error);
    return { breached: false, count: 0 };
  }
}

/**
 * Get user-friendly message about password breach
 */
export function getBreachMessage(count: number): string {
  if (count === 0) {
    return '';
  }
  
  if (count < 100) {
    return `This password has appeared in ${count} data breach${count > 1 ? 'es' : ''}. Consider using a stronger, unique password.`;
  }
  
  if (count < 1000) {
    return `⚠️ Warning: This password has appeared in ${count} data breaches. It's highly recommended to use a different password.`;
  }
  
  return `🚨 Critical: This password has appeared in ${count} data breaches. You must use a different password for security.`;
}

