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
          50: '#e6f1fb',
          100: '#cce3f7',
          200: '#99c7ef',
          300: '#66abe7',
          400: '#338fdf',
          500: '#0C5CAB',
          600: '#0a4a8a',
          700: '#083868',
          800: '#052647',
          900: '#031425',
          950: '#010a13',
        },
        dash: {
          surface: '#09090b',
          card: '#111113',
          elevated: '#18181b',
          border: '#27272a',
          muted: '#3f3f46',
          text: '#fafafa',
          subtle: '#a1a1aa',
        },
        accent: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'glass': '0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.4)',
        'glass-hover': '0 0 0 1px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.5)',
        'glow-blue': '0 0 20px rgba(12,92,171,0.15)',
      }
    },
  },
  plugins: [],
}
export default config
