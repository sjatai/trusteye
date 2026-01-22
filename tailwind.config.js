/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#f0fdf9',
          200: '#a7f3d0',
          700: '#047857',
        },
        sky: {
          50: '#f0f9ff',
          200: '#bae6fd',
          700: '#0369a1',
        },
        teal: {
          50: '#f0fdfa',
          200: '#99f6e4',
          700: '#0f766e',
        },
        emerald: {
          50: '#ecfdf5',
          200: '#a7f3d0',
          700: '#047857',
        },
      },
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
      },
    },
  },
  plugins: [],
}
