import { MD3DarkTheme } from 'react-native-paper';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00f3ff',
    secondary: '#00ff88',
    background: '#0a0e14',
    surface: '#0d1117',
    surfaceVariant: 'rgba(13, 17, 23, 0.8)',
    text: '#e6f3ff',
    textSecondary: '#99ccff',
    accent: '#00f3ff',
    glow: '#00f3ff',
    glowGreen: '#00ff88',
    cardBackground: 'rgba(20, 30, 45, 0.7)',
    cardBorder: '#00f3ff',
    neonCyan: '#00f3ff',
    neonGreen: '#00ff88',
    neonBlue: '#0088ff',
    darkGradientStart: '#0a0e14',
    darkGradientEnd: '#1a2332',
    glassBg: 'rgba(20, 30, 45, 0.6)',
    glassBorder: 'rgba(0, 243, 255, 0.3)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24
  }
};

export const glassStyle = {
  backgroundColor: 'rgba(20, 30, 45, 0.6)',
  borderWidth: 1,
  borderColor: 'rgba(0, 243, 255, 0.3)',
  shadowColor: '#00f3ff',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
};

export const neonGlowCyan = {
  shadowColor: '#00f3ff',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 10,
};

export const neonGlowGreen = {
  shadowColor: '#00ff88',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 10,
};
