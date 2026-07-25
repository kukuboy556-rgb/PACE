/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        sidebar: {
          bg: '#1e1f2b',
          hover: '#2a2b3d',
          active: '#32334a',
          text: '#8b8d9e',
          'text-active': '#ffffff',
        },
        surface: {
          DEFAULT: '#f4f5f8',
          card: '#ffffff',
          border: '#e8e9ef',
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
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 8px 25px -6px rgb(0 0 0 / 0.08), 0 4px 10px -4px rgb(0 0 0 / 0.04)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        dropdown: '0 10px 40px -8px rgb(0 0 0 / 0.15)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
};
