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
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#111111',
          600: '#0a0a0a',
          700: '#050505',
          800: '#030303',
          900: '#010101',
          950: '#000000',
        },
        paper: {
          50: '#FEFDFB',
          100: '#FBF9F5',
          200: '#F5F2EC',
          300: '#EDE9E1',
          400: '#D6D0C4',
          500: '#B8B0A0',
          surface: '#FEFDFB',
          warm: '#F8F5F0',
          cream: '#F5F2EC',
        },
        accent: {
          purple: '#8B5CF6',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['PT Mono', 'monospace'],
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'paper-md': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
        'paper-lg': '0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)',
      }
    },
  },
  plugins: [],
}
export default config
