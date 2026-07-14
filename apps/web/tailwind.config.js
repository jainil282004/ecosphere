/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        info: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        ink: {
          950: '#050710',
          925: '#080b17',
          900: '#0b0f1d',
          850: '#111624',
          800: '#161c2c',
          750: '#1c2337',
          700: '#242c42',
          600: '#323b56',
          500: '#4b556f',
        },
        surface: {
          950: '#050710',
          900: '#0b0f1d',
          850: '#111624',
          800: '#161c2c',
          700: '#242c42',
        },
      },
      fontFamily: {
        sans: [
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: ['"Sora"', '"Inter"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.95rem', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        panel: '0 24px 60px -20px rgba(2, 6, 23, 0.55), 0 1px 0 0 rgba(255, 255, 255, 0.03) inset',
        soft: '0 4px 24px -10px rgba(16, 185, 129, 0.35)',
        glow: '0 0 0 1px rgba(16, 185, 129, 0.25), 0 12px 40px -12px rgba(16, 185, 129, 0.35)',
        'glow-accent': '0 0 0 1px rgba(139, 92, 246, 0.35), 0 12px 40px -12px rgba(139, 92, 246, 0.35)',
        raise: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(180deg, rgba(16,185,129,0.06), rgba(16,185,129,0) 40%), radial-gradient(circle at 20% 0%, rgba(139,92,246,0.14), transparent 45%), radial-gradient(circle at 100% 0%, rgba(16,185,129,0.12), transparent 40%)',
        'brand-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        'accent-gradient': 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #5b21b6 100%)',
        'panel-gradient':
          'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 40%), linear-gradient(180deg, rgba(17,22,36,0.9) 0%, rgba(11,15,29,0.9) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out both',
        'slide-up': 'slideUp 260ms ease-out both',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
