/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          light: '#EFF6FF',
          dark: '#172554',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        brandBg: '#F8FAFC',
        brandSurface: '#FFFFFF',
        brandBorder: '#E2E8F0',
        brandBorderSubtle: '#F1F5F9',
        brandHeading: '#0F172A',
        brandBody: '#475569',
        brandMuted: '#64748B',
        brandSuccess: '#16A34A',
        brandSuccessBg: '#F0FDF4',
        brandSuccessBorder: '#BBF7D0',
        brandWarning: '#D97706',
        brandWarningBg: '#FFFBEB',
        brandWarningBorder: '#FDE68A',
        brandDanger: '#DC2626',
        brandDangerBg: '#FEF2F2',
        brandDangerBorder: '#FECACA',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        bgLight: '#F8F9FF',
        bgDark: '#0B1C30',
        cardLight: '#FFFFFF',
        cardDark: '#131B2E',
        borderLight: '#E2E8F0',
        borderDark: '#1E2D45',
        textPrimary: {
          light: '#0B1C30',
          dark: '#EAF1FF',
        },
        textSecondary: {
          light: '#64748B',
          dark: '#7C8FA6',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xs': '0.25rem',   // 4px
        'sm': '0.375rem',  // 6px
        'md': '0.5rem',    // 8px
        'lg': '0.625rem',  // 10px
        'xl': '0.75rem',   // 12px
        '2xl': '1rem',     // 16px
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card': '0 1px 3px 0 rgb(15 23 42 / 0.05), 0 1px 2px -1px rgb(15 23 42 / 0.03)',
        'card-hover': '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.04)',
        'dropdown': '0 8px 16px -4px rgb(15 23 42 / 0.08), 0 3px 6px -2px rgb(15 23 42 / 0.04)',
        'modal': '0 20px 25px -5px rgb(15 23 42 / 0.1), 0 8px 10px -6px rgb(15 23 42 / 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
