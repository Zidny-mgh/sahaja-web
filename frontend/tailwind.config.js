/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          400: '#b99d7b', // Cokelat Pasir (Aksen/Hover)
          500: '#384e31', // Hijau Tua Sahaja (Primary)
          600: '#2a3b25', // Lebih gelap untuk hover
          700: '#2a3b25',
        },
        emerald: {
          400: '#b99d7b', 
          500: '#384e31',
          600: '#2a3b25',
          700: '#2a3b25',
        },
        primary: {
          DEFAULT: '#384e31',
          dark: '#2a3b25',
          light: '#b99d7b',
        },
        secondary: {
          DEFAULT: '#A1BC98',
          dark: '#85a07c',
          light: '#bdd4b5',
        },
        accent: {
          DEFAULT: '#b99d7b',
          dark: '#a58661',
          light: '#f5ebe0',
        },
        background: '#FFFFFF', // Clean white background
        'dark-neutral': '#111827', // High contrast text color
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
