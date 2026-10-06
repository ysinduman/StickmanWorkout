// Stickman Workout — Design System
// Premium dark theme with vibrant accent colors

export const colors = {
  // Core palette
  background: {
    primary: '#0A0A0F',      // Deep space black
    secondary: '#12121A',    // Card background
    tertiary: '#1A1A2E',     // Elevated surfaces
    input: '#1E1E30',        // Input fields
  },
  text: {
    primary: '#F0F0F5',      // Main text
    secondary: '#A0A0B8',    // Subtitle / muted text
    tertiary: '#6B6B80',     // Placeholder text
    inverse: '#0A0A0F',      // Text on light backgrounds
  },
  accent: {
    primary: '#FF6B35',      // Vibrant orange — main CTA, flame
    secondary: '#FF8F65',    // Light orange — hover/active
    tertiary: '#E55A2B',     // Dark orange — pressed states
  },
  flame: {
    hot: '#FF6B35',          // 100% flame (workout completed)
    warm: '#FF9F1C',         // 50% flame (rest day 1)
    ember: '#E8650A',        // 30% flame (rest day 2)
    out: '#2A2A3E',          // No flame / missed
  },
  status: {
    success: '#4ADE80',      // Green — completed
    warning: '#FBBF24',      // Yellow — caution
    error: '#F87171',        // Red — missed / streak broken
    info: '#60A5FA',         // Blue — informational
  },
  gradient: {
    flameStart: '#FF6B35',
    flameMiddle: '#FF9F1C',
    flameEnd: '#FFD166',
    cardStart: '#1A1A2E',
    cardEnd: '#12121A',
  },
  border: '#2A2A3E',
  divider: '#1E1E30',
  tab: {
    active: '#FF6B35',
    inactive: '#6B6B80',
    background: '#0A0A0F',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

const theme = { colors, spacing, borderRadius, typography, shadows };
export default theme;
