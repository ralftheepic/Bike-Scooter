/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gs-yellow': '#FFDA00', // Example GS Caltex Yellow
        'gs-blue': '#0056B3',   // Example GS Caltex Blue
        'gs-light-gray': '#F0F0F0',
        'gs-dark-gray': '#333333',
      },
    },
  },
  plugins: [],
}