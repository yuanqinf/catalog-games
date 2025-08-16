// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Border classes for dynamic styling
    'border-green-400',
    'border-green-500',
    'border-green-600',
    'border-green-700',
    'border-yellow-400',
    'border-red-400',
    'border-red-500',
    'border-red-600',
    'border-neutral-700',
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      gridTemplateRows: {
        dynamic: 'repeat(var(--grid-rows), minmax(0, 1fr))',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scroll-touch': {
          '-webkit-overflow-scrolling': 'touch',
        },
      });
    },
  ],
};
