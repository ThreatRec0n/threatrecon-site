/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          green: '#10b981',
          'green-dark': '#059669',
          'green-light': '#34d399',
        },
        neon: {
          green: '#00FF88',
          red: '#FF5555',
          blue: '#00BFFF',
        },
        severity: {
          low: '#3B82F6',
          medium: '#F59E0B',
          high: '#EF4444',
          critical: '#DC2626',
        },
      },
      boxShadow: {
        'neon-green': '0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.4)',
        'neon-blue': '0 0 10px rgba(0, 191, 255, 0.8)',
        'neon-red': '0 0 10px rgba(255, 85, 85, 0.8)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.4)',
          },
          '50%': { 
            opacity: '0.8',
            boxShadow: '0 0 20px rgba(0, 255, 136, 1), 0 0 40px rgba(0, 255, 136, 0.6)',
          },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        slideInToast: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseAlert: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        tickerScroll: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'progress-fill': 'progressFill 2s ease-in-out',
        'slide-in-toast': 'slideInToast 0.3s ease-out',
        'pulse-alert': 'pulseAlert 2s ease-in-out infinite',
        'ticker-scroll': 'tickerScroll 20s linear infinite',
      },
      transitionDuration: {
        '400': '400ms',
        '500': '500ms',
      },
    },
  },
  plugins: [],
}
