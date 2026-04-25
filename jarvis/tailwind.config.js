/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hud: {
          bg:      '#04070F',
          surface: '#07090F',
          panel:   '#080D1A',
          alt:     '#0C1525',
          border:  '#14253A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in':             'fadeIn 200ms ease-out',
        'spin-slow':           'spin 9s linear infinite',
        'spin-medium':         'spin 4s linear infinite',
        'spin-fast':           'spin 1.8s linear infinite',
        'spin-reverse-slow':   'spinReverse 12s linear infinite',
        'spin-reverse-medium': 'spinReverse 5s linear infinite',
        'pulse-glow':          'pulseGlow 2.5s ease-in-out infinite',
        'float':               'float 3.5s ease-in-out infinite',
        'wave':                'wave 1.4s ease-in-out infinite',
        'flicker':             'flicker 4s ease-in-out infinite',
        'scan':                'scan 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        spinReverse: {
          from: { transform: 'rotate(360deg)' },
          to:   { transform: 'rotate(0deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(14,165,233,0.35), 0 0 5px rgba(14,165,233,0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(14,165,233,0.85), 0 0 80px rgba(14,165,233,0.4), 0 0 120px rgba(14,165,233,0.15)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.25)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.75' },
          '75%':      { opacity: '0.95' },
        },
        scan: {
          '0%':   { top: '0%',   opacity: '0' },
          '5%':   { opacity: '1' },
          '95%':  { opacity: '0.8' },
          '100%': { top: '100%', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
