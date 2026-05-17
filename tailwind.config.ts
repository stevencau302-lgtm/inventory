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
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#88aaee',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
          950: '#2b4094',
        },
        neo: {
          yellow: '#fdfd96',
          green: '#77dd77',
          blue: '#88aaee',
          pink: '#ffb3ba',
          purple: '#b5a8d5',
          orange: '#ffcba4',
          red: '#ff6b6b',
          bg: '#e8e4d9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #1e293b',
        'neo-sm': '2px 2px 0px 0px #1e293b',
        'neo-lg': '6px 6px 0px 0px #1e293b',
        'neo-xl': '8px 8px 0px 0px #1e293b',
      }
    },
  },
  plugins: [],
}
export default config
