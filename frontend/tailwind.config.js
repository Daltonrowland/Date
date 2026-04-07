/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          900: '#1A0A2E',
          800: '#2D1B4E',
          700: '#4C1D95',
          600: '#6B21A8',
          500: '#9333EA',
          400: '#A855F7',
          300: '#C084FC',
        },
        pink: {
          600: '#DB2777',
          500: '#EC4899',
          400: '#F472B6',
          300: '#F9A8D4',
        },
        gold: {
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FCD34D',
        },
        dark: {
          950: '#0A0A0A',
          900: '#0F0F0F',
          800: '#141414',
          700: '#1C1C1C',
          600: '#242424',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-romantic': 'linear-gradient(135deg, #1A0A2E 0%, #0F0F0F 50%, #1A0A2E 100%)',
        'gradient-score': 'linear-gradient(90deg, #EC4899, #9333EA, #6B21A8)',
        'gradient-card': 'linear-gradient(135deg, rgba(107,33,168,0.15), rgba(236,72,153,0.05))',
      },
    },
  },
  plugins: [],
}
