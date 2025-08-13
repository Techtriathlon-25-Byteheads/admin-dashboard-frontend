// Theme colors - Update these values to change the entire app theme
export const THEME_COLORS = {
  // Primary colors
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7', 
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#4C9B6F', // Main primary color
    600: '#1A5E3A', // Dark primary color
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Secondary colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0', 
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#A8D4B9', // Main secondary color
    600: '#569099', // Secondary accent
    700: '#3F838E', // Secondary dark
    800: '#334155',
    900: '#1e293b',
  },
  
  // Accent colors
  accent: {
    light: '#F2F2F2',
  }
};

// Chart colors for Recharts (uses hex values from theme)
export const CHART_COLORS = [
  THEME_COLORS.primary[500],   // #4C9B6F
  THEME_COLORS.secondary[600], // #569099
  THEME_COLORS.secondary[500], // #A8D4B9
  THEME_COLORS.secondary[700], // #3F838E
  THEME_COLORS.primary[600],   // #1A5E3A
];

// Export individual colors for easy access
export const PRIMARY_COLOR = THEME_COLORS.primary[500];
export const PRIMARY_DARK = THEME_COLORS.primary[600];
export const SECONDARY_COLOR = THEME_COLORS.secondary[500];
export const SECONDARY_ACCENT = THEME_COLORS.secondary[600];
export const SECONDARY_DARK = THEME_COLORS.secondary[700];
