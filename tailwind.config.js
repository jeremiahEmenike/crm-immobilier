/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf5ff',
          100: '#d6eaff',
          200: '#a8d5ff',
          300: '#6bb8ff',
          400: '#2997ff',
          500: '#0071e3',
          600: '#0064cc',
          700: '#0055b3',
          800: '#004699',
          900: '#003680',
        },
        dark: {
          50: '#1d1d1f',
          100: '#424245',
          200: '#86868b',
          300: '#aeaeb2',
          400: '#d2d2d7',
          500: '#e8e8ed',
          600: '#ffffff',
          700: '#f5f5f7',
          800: '#fafafa',
          900: '#f5f5f7',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
