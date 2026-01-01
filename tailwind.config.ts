import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          50: '#e6f7f7',
          100: '#ccefef',
          200: '#99dfdf',
          300: '#66cfcf',
          400: '#33bfbf',
          500: '#00afaf', // Main brand color
          600: '#008c8c',
          700: '#006969',
          800: '#004646',
          900: '#002323',
        },
        // Status Colors
        status: {
          pending: '#fbbf24',
          confirmed: '#3b82f6',
          assigned: '#8b5cf6',
          picked_up: '#f97316',
          on_the_way: '#06b6d4',
          delivered: '#22c55e',
          cancelled: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
