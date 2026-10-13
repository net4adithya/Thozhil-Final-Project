import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';

// Reuses the same "focus room" palette the app already used as CSS variables, so
// swapping the hand-rolled design system for real Vuetify components doesn't change
// the app's look.
const thozhilLight = {
  dark: false,
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    'surface-bright': '#F1F5F9',
    primary: '#006491',
    secondary: '#0284C7',
    error: '#DC2626',
    warning: '#D97706',
    success: '#059669',
    'on-background': '#0F172A',
    'on-surface': '#0F172A',
  },
};

export default createVuetify({
  theme: {
    defaultTheme: 'thozhilLight',
    themes: { thozhilLight },
  },
  defaults: {
    VCard: { rounded: 'lg' },
    VBtn: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
  },
});
