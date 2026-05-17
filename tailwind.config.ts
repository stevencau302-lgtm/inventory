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
          100: '#dbe6fe',
          200: '#bfcffc',
          300: '#93adf8',
          400: '#6b8bf3',
          500: '#1b2e4b',
          600: '#162540',
          700: '#111c33',
          800: '#0c1426',
          900: '#080d1a',
          950: '#04070f',
        },
        cozy: {
          bg: '#faf9f7',
          surface: '#ffffff',
          card: '#ffffff',
          navy: '#1b2e4b',
          navyLight: '#2d4a6f',
          gold: '#f5c542',
          goldLight: '#fef3c7',
          gray: '#f3f2ef',
          border: '#e8e6e1',
          muted: '#9ca3af',
          text: '#1f2937',
          subtle: '#6b7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
        'soft-md': '0 4px 12px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)',
        'soft-lg': '0 8px 24px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
export default config
