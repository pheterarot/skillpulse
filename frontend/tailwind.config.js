/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#14151A',
        surface: '#1C1E26',
        'accent-primary': '#F2A93B',
        'accent-secondary': '#4FD1C5',
        'text-primary': '#EDEDED',
        'text-secondary': '#9CA3AF',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
