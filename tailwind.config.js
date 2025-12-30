
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'], // closest free match to Codec Pro style
      },
      colors: {
        'passport-teal': '#2dd4bf',
        'passport-dark': '#0f172a',
      }
    },
  },
  plugins: [],
}
