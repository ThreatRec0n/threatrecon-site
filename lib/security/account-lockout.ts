/**
 * Account Lockout Management
 * 
 * Implements account lockout after 5 failed login attempts
 * with 15-minute lockout duration and email notifications.
 */

export interface LockoutRecord {
  email: string;
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// In-memory store (use Redis in production)
const lockoutStore = new Map<string, LockoutRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if account is locked
 */
export function isAccountLocked(email: string): boolean {
  const record = lockoutStore.get(email.toLowerCase());
  if (!record || !record.lockedUntil) {
    return false;
  }
  
  // Check if lockout has expired
  if (Date.now() > record.lockedUntil) {
    lockoutStore.delete(email.toLowerCase());
    return false;
  }
  
  return true;
}

/**
 * Get lockout time remaining in seconds
 */
export function getLockoutTimeRemaining(email: string): number {
  const record = lockoutStore.get(email.toLowerCase());
  if (!record || !record.lockedUntil) {
    return 0;
  }
  
  const remaining = Math.ceil((record.lockedUntil - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * Record a failed login attempt
 * Returns true if account should be locked
 */
export function recordFailedAttempt(email: string): { locked: boolean; attemptsRemaining: number } {
  const normalizedEmail = email.toLowerCase();
  const record = lockoutStore.get(normalizedEmail) || {
    email: normalizedEmail,
    failedAttempts: 0,
    lockedUntil: null,
    lastAttempt: Date.now(),
  };
  
  record.failedAttempts += 1;
  record.lastAttempt = Date.now();
  
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    lockoutStore.set(normalizedEmail, record);
    
    // TODO: Send email notification
    // sendLockoutEmail(email, record.lockedUntil);
    
    return { locked: true, attemptsRemaining: 0 };
  }
  
  lockoutStore.set(normalizedEmail, record);
  return { 
    locked: false, 
    attemptsRemaining: MAX_FAILED_ATTEMPTS - record.failedAttempts 
  };
}

/**
 * Reset failed attempts on successful login
 */
export function resetFailedAttempts(email: string): void {
  lockoutStore.delete(email.toLowerCase());
}

/**
 * Manually unlock an account (admin function)
 */
export function unlockAccount(email: string): void {
  lockoutStore.delete(email.toLowerCase());
}

/**
 * Get lockout status for an account
 */
export function getLockoutStatus(email: string): LockoutRecord | null {
  const record = lockoutStore.get(email.toLowerCase());
  if (!record) {
    return null;
  }
  
  // Clean up expired lockouts
  if (record.lockedUntil && Date.now() > record.lockedUntil) {
    lockoutStore.delete(email.toLowerCase());
    return null;
  }
  
  return record;
}

/**
 * Get all locked accounts (admin function)
 */
export function getAllLockedAccounts(): LockoutRecord[] {
  const now = Date.now();
  const locked: LockoutRecord[] = [];
  
  for (const [email, record] of lockoutStore.entries()) {
    if (record.lockedUntil && record.lockedUntil > now) {
      locked.push(record);
    } else if (record.lockedUntil && record.lockedUntil <= now) {
      // Clean up expired
      lockoutStore.delete(email);
    }
  }
  
  return locked;
}

