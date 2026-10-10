/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Warm gold taken from the logo
        gold: {
          300: '#ecd391',
          400: '#dcb865',
          500: '#c9a24a',
          600: '#a9832f',
        },
        accent: {
          500: '#0ea5e9',
          600: '#0284c7',
        },
        success: {
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 4px 16px -4px rgb(15 23 42 / 0.08)',
        'card-hover': '0 2px 4px 0 rgb(15 23 42 / 0.05), 0 12px 28px -8px rgb(15 23 42 / 0.16)',
        glow: '0 1px 0 0 rgb(255 255 255 / 0.18) inset, 0 8px 20px -8px rgb(37 99 235 / 0.65)',
        'glow-lg': '0 1px 0 0 rgb(255 255 255 / 0.22) inset, 0 12px 28px -8px rgb(37 99 235 / 0.8)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};