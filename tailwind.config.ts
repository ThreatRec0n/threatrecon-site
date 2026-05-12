import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d0d0d',
          secondary: '#141414',
          tertiary: '#1a1a1a',
          paper: '#f5f0e8',
        },
        amber: {
          DEFAULT: '#d4a017',
          bright: '#f0b429',
          dim: 'rgba(212,160,23,0.15)',
        },
        threat: {
          red: '#cc2200',
          'red-dim': 'rgba(204,34,0,0.1)',
          green: '#1a6b3a',
          'green-dim': 'rgba(26,107,58,0.1)',
        },
        ink: {
          primary: '#e8e4dc',
          secondary: '#9a9080',
          muted: '#5a5248',
          dark: '#1a1612',
        },
        border: {
          DEFAULT: 'rgba(212,160,23,0.15)',
          active: 'rgba(212,160,23,0.5)',
        },
        evidence: {
          file: '#5e9bff',
          email: '#b48eff',
          network: '#00d97e',
          access: '#ffaa00',
          usb: '#ff6b6b',
          badge: '#4de8ff',
          message: '#ff9f43',
        },
      },
      fontFamily: {
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
        display: ['Bricolage Grotesque Variable', 'Bricolage Grotesque', 'sans-serif'],
        document: ['Georgia', 'serif'],
      },
      boxShadow: {
        polaroid: '0 4px 14px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config;
