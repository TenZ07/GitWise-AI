import theme from './src/config/theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ✅ Pulls from central theme config
        primary: theme.colors.primary,
        primaryHover: theme.colors.primaryHover,
        primaryLight: theme.colors.primaryLight,
        accent: theme.colors.accent,
        accentHover: theme.colors.accentHover,
        secondary: theme.colors.secondary,
        bg: theme.colors.bg,
        surface: theme.colors.surface,
        surfaceHover: theme.colors.surfaceHover,
        surfaceBorder: theme.colors.surfaceBorder,
        textMain: theme.colors.textMain,
        textMuted: theme.colors.textMuted,
        textDisabled: theme.colors.textDisabled,
        success: theme.colors.success,
        warning: theme.colors.warning,
        danger: theme.colors.danger,
        info: theme.colors.info,
      },
      backgroundImage: {
        'gradient-primary': theme.colors.gradients.primary,
        'gradient-neon': theme.colors.gradients.neon,
        'gradient-dark': theme.colors.gradients.dark,
      },
      boxShadow: {
        'neon': theme.colors.shadows.neon,
        'glow': theme.colors.shadows.glow,
        'card': theme.colors.shadows.card,
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: theme.colors.shadows.neon },
          '100%': { boxShadow: theme.colors.shadows.glow },
        }
      }
    },
  },
  plugins: [],
}