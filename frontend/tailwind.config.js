/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dongquang: {
          blue: '#1e3a8a',
          gold: '#d97706',
          light: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
};
