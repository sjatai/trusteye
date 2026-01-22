import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'premier-blue': '#1B3A6D',
        'premier-red': '#C41E3A',
        'premier-gray': '#4A4A4A',
      },
    },
  },
  plugins: [],
}
export default config
