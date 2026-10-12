import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Sarabun',
          'Tahoma',
          'Leelawadee UI',
          'Thonburi',
          'sans-serif',
        ],
        heading: [
          'var(--font-sans)',
          'Sarabun',
          'Tahoma',
          'Leelawadee UI',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightish: '-0.012em',
      },
      colors: {
        border: 'var(--border)',
        input:  'var(--input)',
        ring:   'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        ha: {
          primary: 'var(--ha-primary)',
          'primary-light': 'var(--ha-primary-light)',
          secondary: 'var(--ha-secondary)',
          green: 'var(--ha-green)',
          'green-dark': 'var(--ha-green-dark)',
          'green-light': 'var(--ha-green-light)',
          'green-soft': 'var(--ha-green-soft)',
          'purple-soft': 'var(--ha-purple-soft)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.02)',
        soft: '0 2px 8px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03)',
        elevated:
          '0 1px 2px rgba(15, 23, 42, 0.04), 0 14px 32px -16px rgba(15, 23, 42, 0.16)',
        ring: '0 0 0 1px rgba(109, 40, 217, 0.14), 0 10px 24px -12px rgba(109, 40, 217, 0.28)',
      },

    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
