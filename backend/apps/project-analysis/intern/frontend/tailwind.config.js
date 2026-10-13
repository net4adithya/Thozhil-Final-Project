/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand blue — primary interactive color (from sample: #1D78F8 / DESIGN.md: secondary #0058be)
        brand: {
          DEFAULT: '#1D78F8',
          hover:   '#1558C0',
          light:   '#E8F1FF',
          dark:    '#1558C0',
        },

        // Surfaces — from DESIGN.md surface scale
        bgLight:   '#F8F9FF',
        bgDark:    '#0B1C30',
        cardLight: '#FFFFFF',
        cardDark:  '#131B2E',

        // Borders
        borderLight: '#E2E8F0',
        borderDark:  '#1E2D45',

        // Primary — Black for headings (DESIGN.md primary: #000000)
        primary: {
          DEFAULT: '#0B1C30',
          hover:   '#213145',
        },

        // Interactive — Brand blue (replaces old "secondary")
        secondary: {
          DEFAULT: '#1D78F8',
          hover:   '#1558C0',
        },

        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',

        // Text
        textPrimary: {
          light: '#0B1C30',
          dark:  '#EAF1FF',
        },
        textSecondary: {
          light: '#64748B',
          dark:  '#7C8FA6',
        },

        // Outline
        outline:          '#76777D',
        'outline-variant': '#C6C6CD',
      },

      borderRadius: {
        DEFAULT: '0.5rem',
        sm:      '0.25rem',
        md:      '0.5rem',
        lg:      '0.75rem',
        xl:      '1rem',
        '2xl':   '1.25rem',
        full:    '9999px',
        card:    '0.75rem',
        btn:     '0.5rem',
        input:   '0.5rem',
      },

      boxShadow: {
        card:          '0 1px 4px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover':  '0 4px 16px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.06)',
        dropdown:      '0 4px 16px rgba(15,23,42,0.10)',
        modal:         '0 8px 32px rgba(15,23,42,0.14)',
        'brand-glow':  '0 4px 14px rgba(29,120,248,0.20)',
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Sans"', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
