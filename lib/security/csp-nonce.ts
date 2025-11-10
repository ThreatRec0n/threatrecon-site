/**
 * Content Security Policy Nonce Generator
 * 
 * This module provides utilities for generating and managing CSP nonces
 * to replace 'unsafe-inline' in our CSP policy.
 * 
 * Note: Next.js handles nonces automatically in production, but we document
 * inline scripts that need refactoring here.
 */

/**
 * Generate a nonce for CSP
 * In production, Next.js will handle this automatically
 */
export function generateNonce(): string {
  if (typeof window !== 'undefined') {
    // Client-side: nonce should come from server
    return '';
  }
  // Server-side: generate random nonce
  return Buffer.from(crypto.randomBytes(16)).toString('base64');
}

/**
 * List of inline scripts that need refactoring:
 * 
 * 1. app/layout.tsx - HTML comment injection (lines 16-34, 38-56)
 *    - Status: Low priority, decorative only
 *    - Action: Can be moved to server-side rendering or removed
 * 
 * 2. Various onClick handlers in components
 *    - Status: Can be refactored to use event delegation
 *    - Action: Convert to data attributes and event listeners
 * 
 * 3. Inline styles in some components
 *    - Status: Should use CSS classes or styled-components
 *    - Action: Extract to CSS modules or Tailwind classes
 * 
 * Current CSP allows 'unsafe-inline' for:
 * - script-src: Required for Next.js hydration
 * - style-src: Required for Tailwind CSS and component styles
 * 
 * TODO: Implement nonce-based script execution for custom scripts
 * TODO: Move inline styles to CSS modules
 * TODO: Refactor onClick handlers to use event delegation
 */

export const INLINE_SCRIPTS_TO_REFACTOR = [
  {
    file: 'app/layout.tsx',
    lines: '16-34, 38-56',
    type: 'HTML comment injection',
    priority: 'low',
    description: 'Decorative HTML comments, can be removed or moved to SSR',
  },
];

