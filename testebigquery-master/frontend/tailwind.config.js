/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        gov: {
          50:  '#eef4fb',
          100: '#d5e3f5',
          200: '#afc8eb',
          300: '#7ea5dc',
          400: '#4a7ec8',
          500: '#2b5ea6',
          600: '#1e4a8a',
          700: '#183d72',
          800: '#12305a',
          900: '#0f172a',
          950: '#0a1020',
        },
        health: {
          50:  '#effefb',
          100: '#c8fff4',
          200: '#91fee9',
          300: '#52f5db',
          400: '#1de0c6',
          500: '#0d9488',
          600: '#097c72',
          700: '#0c635c',
          800: '#0f504b',
          900: '#10423e',
        },
      },
    },
  },
  plugins: [],
}
