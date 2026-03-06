/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF9E6',
          100: '#FFF0BF',
          200: '#FFE080',
          300: '#FFD040',
          400: '#D4B055',
          500: '#C9A84C',
          600: '#A68B3A',
          700: '#836E2E',
          800: '#615123',
          900: '#3E3517',
        },
        dark: {
          50: '#ECEAE5',
          100: '#9496A6',
          200: '#5D5F72',
          300: '#2E3148',
          400: '#222640',
          500: '#1C2030',
          600: '#171A24',
          700: '#111319',
          800: '#0D0F15',
          900: '#0A0C10',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
