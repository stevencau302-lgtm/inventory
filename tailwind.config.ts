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
        neo: {
          bg: '#fffdf7',
          surface: '#ffffff',
          black: '#1a1a1a',
          orange: '#f97316',
          yellow: '#facc15',
          emerald: '#10b981',
          indigo: '#6366f1',
          pink: '#ec4899',
          red: '#ef4444',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          amber: '#f59e0b',
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        cozy: {
          bg: '#fffdf7',
          surface: '#ffffff',
          card: '#ffffff',
          navy: '#1b2e4b',
          navyLight: '#2d4a6f',
          gold: '#f59e0b',
          goldLight: '#fef3c7',
          gray: '#f5f5f4',
          border: '#1a1a1a',
          muted: '#6b7280',
          text: '#1a1a1a',
          subtle: '#4b5563',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'neo': '5px 5px 0px #1a1a1a',
        'neo-sm': '3px 3px 0px #1a1a1a',
        'neo-md': '6px 6px 0px #1a1a1a',
        'neo-lg': '8px 8px 0px #1a1a1a',
        'neo-orange': '5px 5px 0px #ea580c',
        'neo-emerald': '5px 5px 0px #059669',
        'neo-indigo': '5px 5px 0px #4338ca',
        'neo-pink': '5px 5px 0px #be185d',
        'neo-hover': '2px 2px 0px #1a1a1a',
      }
    },
  },
  plugins: [],
}
export default config
