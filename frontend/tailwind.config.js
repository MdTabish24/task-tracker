/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#e8eef5',
        ink: '#25314e',
        muted: '#697995',
        accent: '#2e66e8',
      },
      boxShadow: {
        raised: '7px 7px 15px #c5cfda, -7px -7px 15px #ffffff',
        inset: 'inset 4px 4px 8px #cbd4df, inset -4px -4px 8px #ffffff',
      },
    },
  },
  plugins: [],
}
