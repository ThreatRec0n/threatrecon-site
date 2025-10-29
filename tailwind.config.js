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
      },
      boxShadow: {
        'neon-green': '0 0 10px rgba(16, 185, 129, 0.8)',
        'neon-blue': '0 0 10px rgba(96, 165, 250, 0.8)',
        'neon-red': '0 0 10px rgba(220, 38, 38, 0.8)',
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

