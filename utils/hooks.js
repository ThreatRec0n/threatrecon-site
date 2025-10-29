import { useRef, useCallback } from 'react';

/**
 * Debounce hook for delaying function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebounce(func, wait = 300) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, wait);
    },
    [func, wait]
  );
}

/**
 * Throttle hook for limiting function execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions in milliseconds
 * @returns {Function} Throttled function
 */
export function useThrottle(func, limit = 300) {
  const lastRanRef = useRef(null);
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (!lastRanRef.current) {
        func(...args);
        lastRanRef.current = Date.now();
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (Date.now() - lastRanRef.current >= limit) {
            func(...args);
            lastRanRef.current = Date.now();
          }
        }, limit - (Date.now() - lastRanRef.current));
      }
    },
    [func, limit]
  );
}

/**
 * Safe audio trigger with throttling
 * @param {number} frequency - Audio frequency in Hz
 * @param {number} duration - Duration in milliseconds
 * @param {number} throttleMs - Minimum time between calls
 * @returns {Function} Throttled audio function
 */
export function useAudioCue(throttleMs = 100) {
  const lastPlayRef = useRef(0);
  const audioContextRef = useRef(null);

  return useCallback(
    (frequency = 800, duration = 100) => {
      const now = Date.now();
      if (now - lastPlayRef.current < throttleMs) {
        return;
      }
      lastPlayRef.current = now;

      if (typeof window === 'undefined') return;

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContextRef.current.currentTime + duration / 1000
        );

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
      } catch (error) {
        // Silently fail if audio is not available
        if (process.env.NODE_ENV === 'development') {
          console.debug('Audio context unavailable:', error.message);
        }
      }
    },
    [throttleMs]
  );
}

