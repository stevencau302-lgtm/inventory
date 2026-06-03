import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
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
          orange: '#FF5F03',
          yellow: '#facc15',
          emerald: '#16A34A',
          indigo: '#6366f1',
          pink: '#ec4899',
          red: '#DC2626',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          amber: '#D97706',
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF5F03',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        enterprise: {
          primary: '#072C2C',
          secondary: '#FF5F03',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          surface: '#EDEADE',
          text: '#111827',
          neutral: '#EDEADE',
        }
      },
      fontFamily: {
        sans: ['Ubuntu', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Oswald', 'system-ui', 'sans-serif'],
        mono: ['Ubuntu Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'neo': '5px 5px 0px #1a1a1a',
        'neo-sm': '3px 3px 0px #1a1a1a',
        'neo-md': '6px 6px 0px #1a1a1a',
        'neo-lg': '8px 8px 0px #1a1a1a',
        'neo-hover': '2px 2px 0px #1a1a1a',
      }
    },
  },
  plugins: [],
}
export default config
