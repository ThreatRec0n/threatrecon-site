/**
 * Performance monitoring utilities
 * Tracks Web Vitals and custom performance metrics
 */

export interface WebVitalMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: PerformanceEntry[];
}

export function reportWebVitals(metric: WebVitalMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const body = JSON.stringify(metric);
    const url = '/api/analytics/web-vitals';

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: 'POST', keepalive: true }).catch(console.error);
    }
  }
}

/**
 * Measure custom performance metrics
 */
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  if (typeof window === 'undefined' || !window.performance) {
    return fn();
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `measure-${name}`;

  performance.mark(startMark);
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.then(() => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
      return result;
    });
  } else {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure && process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
    }
    return result;
  }
}

