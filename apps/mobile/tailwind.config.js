/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#17A06A',
        expense: '#F0742B',
        insight: '#7C5CFC',
        ink: '#1B1D21',
        background: '#F3F4F6',
        card: '#FFFFFF',
      },
      borderRadius: {
        card: '22px',
      },
    },
  },
  plugins: [],
};
