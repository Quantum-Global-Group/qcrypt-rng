// quantum-oracle-ui/tailwind.config.ts
// Research Platform — IBM Plex design system tokens
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:     ['IBM Plex Sans',  'ui-sans-serif',  'system-ui', 'sans-serif'],
        mono:     ['IBM Plex Mono',  'ui-monospace',   'monospace'],
        serif:    ['IBM Plex Serif', 'Georgia',         'serif'],
        headline: ['IBM Plex Sans',  'ui-sans-serif',  'system-ui', 'sans-serif'],
        body:     ['IBM Plex Sans',  'ui-sans-serif',  'system-ui', 'sans-serif'],
        label:    ['IBM Plex Sans',  'ui-sans-serif',  'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.5625rem', { lineHeight: '0.875rem' }],   // 9px — labels
        xs:    ['0.625rem',  { lineHeight: '1rem'     }],   // 10px — captions
        sm:    ['0.6875rem', { lineHeight: '1.125rem' }],   // 11px — mono data
        base:  ['0.8125rem', { lineHeight: '1.3rem'   }],   // 13px — body
        lg:    ['0.9375rem', { lineHeight: '1.4rem'   }],   // 15px — title
        xl:    ['1.125rem',  { lineHeight: '1.5rem'   }],   // 18px — section head
        '2xl': ['1.25rem',   { lineHeight: '1.6rem'   }],   // 20px — headline
        '3xl': ['1.5rem',    { lineHeight: '1.7rem'   }],   // 24px — display
      },

      borderRadius: {
        DEFAULT: '0.1875rem',   // 3px
        sm:      '0.125rem',    // 2px
        md:      '0.1875rem',   // 3px
        lg:      '0.25rem',     // 4px
        xl:      '0.375rem',    // 6px
        full:    '9999px',
      },

      colors: {
        // ── Surface hierarchy ────────────────────────────────────────────
        background:                   '#0a0a0b',
        surface:                      '#0f0f12',
        'surface-dim':                '#0a0a0b',
        'surface-container-lowest':   '#0f0f12',
        'surface-container-low':      '#16161a',
        'surface-container':          '#1c1c21',
        'surface-container-high':     '#242429',
        'surface-container-highest':  '#2e2e35',
        'surface-variant':            '#2e2e35',
        'surface-bright':             '#38383f',

        // ── On-surface ───────────────────────────────────────────────────
        'on-background':      '#e2e0dd',
        'on-surface':         '#e2e0dd',
        'on-surface-variant': '#9b9891',
        'inverse-surface':    '#e2e0dd',
        'inverse-on-surface': '#1c1c21',

        // ── Borders ──────────────────────────────────────────────────────
        outline:         '#5e5c57',
        'outline-variant': '#2e2c29',

        // ── Primary — teal/cyan (verified, active) ───────────────────────
        primary:                 '#00d4a8',
        'on-primary':            '#003828',
        'primary-container':     '#00a882',
        'on-primary-container':  '#002e22',
        'primary-fixed':         '#6ffbbe',
        'primary-fixed-dim':     '#00d4a8',
        'on-primary-fixed':      '#002113',
        'inverse-primary':       '#00a882',

        // ── Secondary — blue (info, nav) ─────────────────────────────────
        secondary:               '#0090ff',
        'on-secondary':          '#003060',
        'secondary-container':   '#0066cc',
        'on-secondary-container': '#002a52',

        // ── Tertiary — amber (caution, simulated) ────────────────────────
        tertiary:               '#f5a623',
        'on-tertiary':          '#3d2800',
        'tertiary-container':   '#c47d00',
        'on-tertiary-container': '#2a1900',

        // ── Error — rose (degraded, fail) ────────────────────────────────
        error:               '#ff5b5b',
        'on-error':          '#5a0000',
        'error-container':   '#cc2222',
        'on-error-container': '#ffd7d7',
      },

      spacing: {
        // 8px grid
        '0.5': '0.125rem',   // 2px
        '1':   '0.25rem',    // 4px
        '1.5': '0.375rem',   // 6px
        '2':   '0.5rem',     // 8px
        '2.5': '0.625rem',   // 10px
        '3':   '0.75rem',    // 12px
        '3.5': '0.875rem',   // 14px
        '4':   '1rem',       // 16px
        '5':   '1.25rem',    // 20px
        '6':   '1.5rem',     // 24px
        '8':   '2rem',       // 32px
        '10':  '2.5rem',     // 40px
        '12':  '3rem',       // 48px
        '16':  '4rem',       // 64px
      },

      animation: {
        'live-pulse': 'live-pulse 2s ease-in-out infinite',
        'page-enter': 'page-enter 0.15s ease-out',
        'fade-in':    'fade-in 0.2s ease-out',
      },

      keyframes: {
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
