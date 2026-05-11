/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#060a12',
          secondary: '#0a0e1a',
          tertiary: '#0f1824',
        },
        tr: {
          cyan: '#5e9bff',
          red: '#ff3b3b',
          yellow: '#ffaa00',
          green: '#00d97e',
          purple: '#b48eff',
        },
      },
      fontFamily: {
        mono: ['Geist Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'monospace'],
        display: ['Bricolage Grotesque', 'Syne', 'sans-serif'],
        body: ['Inter', 'Bricolage Grotesque', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
