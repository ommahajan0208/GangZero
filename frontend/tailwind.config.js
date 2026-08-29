/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        risk: {
          high: '#DC2626',
          suspicious: '#F59E0B',
          verified: '#16A34A',
          unknown: '#6B7280',
        },
        accent: {
          DEFAULT: '#B91C1C',
          hover: '#991B1B',
        },
        surface: '#FFFFFF',
        canvas: '#FAFAFA',
        sunken: '#F4F4F4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
};
