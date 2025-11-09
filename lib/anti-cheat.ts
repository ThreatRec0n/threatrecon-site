// Anti-cheat measures for game integrity

/**
 * Game integrity monitor - detects tampering attempts
 */
export class GameIntegrityMonitor {
  private startTime: number;
  private expectedDuration: number;
  private lastCheckTime: number;
  private violations: string[] = [];
  private isMonitoring: boolean = false;

  constructor(expectedDuration: number) {
    this.startTime = Date.now();
    this.expectedDuration = expectedDuration;
    this.lastCheckTime = Date.now();
  }

  start(): void {
    this.isMonitoring = true;
    this.startTime = Date.now();
    this.lastCheckTime = Date.now();
    this.violations = [];
    
    // Monitor for DevTools
    this.monitorDevTools();
    
    // Monitor for time manipulation
    this.monitorTimeManipulation();
    
    // Monitor for state tampering
    this.monitorStateTampering();
  }

  stop(): void {
    this.isMonitoring = false;
  }

  private monitorDevTools(): void {
    if (typeof window === 'undefined') return;
    
    const checkInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(checkInterval);
        return;
      }
      
      // Check for DevTools (basic detection)
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (widthDiff > 200 || heightDiff > 200) {
        this.recordViolation('DevTools detected');
      }
    }, 1000);
  }

  private monitorTimeManipulation(): void {
    if (typeof window === 'undefined') return;
    
    let lastRealTime = Date.now();
    
    const checkInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(checkInterval);
        return;
      }
      
      const currentTime = Date.now();
      const elapsed = currentTime - lastRealTime;
      
      // Detect if time was manipulated (unusual jumps)
      if (elapsed > 5000 || elapsed < -1000) {
        this.recordViolation('Time manipulation detected');
      }
      
      lastRealTime = currentTime;
    }, 1000);
  }

  private monitorStateTampering(): void {
    if (typeof window === 'undefined') return;
    
    // Monitor for localStorage/sessionStorage tampering
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;
    
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key.includes('game') || key.includes('score') || key.includes('time')) {
        console.warn('Game state modification attempt detected');
      }
      return originalSetItem.call(this, key, value);
    };
  }

  recordViolation(reason: string): void {
    if (!this.violations.includes(reason)) {
      this.violations.push(reason);
      console.warn(`[Security] ${reason}`);
    }
  }

  getViolations(): string[] {
    return [...this.violations];
  }

  hasViolations(): boolean {
    return this.violations.length > 0;
  }

  validateTimeElapsed(): boolean {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const maxAllowed = this.expectedDuration * 1.2; // 20% tolerance
    
    if (elapsed < 0 || elapsed > maxAllowed) {
      this.recordViolation('Invalid time elapsed');
      return false;
    }
    
    return true;
  }

  getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}

/**
 * Validates that game state hasn't been tampered with
 */
export function validateGameStateIntegrity(
  state: any,
  startTime: number,
  expectedDuration: number
): { valid: boolean; reason?: string } {
  // Check time hasn't been manipulated
  const elapsed = (Date.now() - startTime) / 1000;
  if (elapsed < 0 || elapsed > expectedDuration * 1.5) {
    return { valid: false, reason: 'Time manipulation detected' };
  }
  
  // Check score is within valid range
  if (state.score !== undefined) {
    if (typeof state.score !== 'number' || state.score < 0 || state.score > 100) {
      return { valid: false, reason: 'Invalid score value' };
    }
  }
  
  // Check IPs are valid
  if (state.foundIPs && Array.isArray(state.foundIPs)) {
    for (const ip of state.foundIPs) {
      if (typeof ip !== 'string' || !/^[\d.]+$/.test(ip)) {
        return { valid: false, reason: 'Invalid IP address format' };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Prevents console access (basic protection)
 */
export function protectConsole(): void {
  if (typeof window === 'undefined') return;
  
  // Don't completely disable console (would break debugging)
  // Instead, just log warnings
  const originalConsole = { ...console };
  
  // Monitor for suspicious console usage
  const suspiciousMethods = ['clear', 'debug', 'trace'];
  suspiciousMethods.forEach(method => {
    if (console[method as keyof Console]) {
      const original = console[method as keyof Console] as Function;
      (console[method as keyof Console] as any) = function(...args: any[]) {
        console.warn('[Security] Suspicious console method called:', method);
        return original.apply(console, args);
      };
    }
  });
}

