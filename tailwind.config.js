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
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'progress-fill': 'progressFill 2s ease-in-out',
      },
      transitionDuration: {
        '400': '400ms',
        '500': '500ms',
      },
    },
  },
  plugins: [],
}
