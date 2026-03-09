// ✅ CENTRALIZED COLOR THEME CONFIGURATION
// Change colors here → Updates everywhere automatically

export const theme = {
  // 🎨 ELECTRIC KIWI THEME (Default)
  colors: {
    // Primary Colors
    primary: '#CCFF00',        // Electric Lime
    primaryHover: '#B3E600',   // Darker lime for hover
    primaryLight: '#E5FF80',   // Light tint for backgrounds
    
    // Accent Colors
    accent: '#FFFF00',         // Bright Yellow
    accentHover: '#E6E600',    // Darker yellow for hover
    secondary: '#DFFF00',      // Lime Yellow
    
    // Background Colors
    bg: '#000000',             // Pure Black
    surface: '#0A0A0A',        // Card background
    surfaceHover: '#141414',   // Hover state
    surfaceBorder: '#1A1A1A',  // Border color
    
    // Text Colors
    textMain: '#FFFFFF',       // Primary text
    textMuted: '#A3A3A3',      // Secondary text
    textDisabled: '#666666',   // Disabled text
    
    // Status Colors
    success: '#CCFF00',        // Lime (same as primary)
    warning: '#FFFF00',        // Yellow (same as accent)
    danger: '#FF3333',         // Neon Red
    info: '#00FFFF',           // Cyan
    
    // Gradient Presets
    gradients: {
      primary: 'linear-gradient(135deg, #CCFF00 0%, #FFFF00 100%)',
      neon: 'linear-gradient(135deg, #CCFF00 0%, #00FFFF 100%)',
      dark: 'linear-gradient(180deg, #0A0A0A 0%, #000000 100%)',
    },
    
    // Shadow Presets
    shadows: {
      neon: '0 0 10px rgba(204, 255, 0, 0.5), 0 0 20px rgba(204, 255, 0, 0.3)',
      glow: '0 0 20px rgba(204, 255, 0, 0.4), 0 0 40px rgba(204, 255, 0, 0.2)',
      card: '0 4px 20px rgba(0, 0, 0, 0.5)',
    },
  },
  
  // 🎭 ALTERNATE THEMES (Uncomment to switch)
  themes: {
    // Electric Kiwi (Current)
    electricKiwi: {
      primary: '#CCFF00',
      primaryHover: '#B3E600',
      accent: '#FFFF00',
      bg: '#000000',
      surface: '#0A0A0A',
    },
    
    // Cyber Purple
    cyberPurple: {
      primary: '#BD00FF',
      primaryHover: '#9D00D6',
      accent: '#00FFFF',
      bg: '#0A0014',
      surface: '#14001F',
    },
    
    // Neon Blue
    neonBlue: {
      primary: '#00F0FF',
      primaryHover: '#00D4E6',
      accent: '#FF00FF',
      bg: '#000A0F',
      surface: '#00141F',
    },
    
    // Matrix Green
    matrixGreen: {
      primary: '#00FF41',
      primaryHover: '#00D636',
      accent: '#00FF00',
      bg: '#000000',
      surface: '#000A00',
    },
  },
};

// ✅ Export individual colors for easy import
export const { colors, gradients, shadows } = theme;
export default theme;