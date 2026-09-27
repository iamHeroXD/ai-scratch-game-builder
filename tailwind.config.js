/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        scratch: {
          orange: '#FFAB19',
          yellow: '#FFBF00',
          green: '#59C059',
          blue: '#4C97FF',
          purple: '#9966FF',
          pink: '#FF6680',
          dark: '#111827',
          surface: '#1F2937',
          border: '#374151',
        },
      },
    },
  },
  plugins: [],
};
