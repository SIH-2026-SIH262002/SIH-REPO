export interface ThemeColors {
  primary: string;
  primaryDark: string;
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textSubtle: string;

  // Severity Colors
  riskLow: string;
  riskModerate: string;
  riskHigh: string;
  riskSevere: string;

  // Actions
  sosRed: string;
  sosGlow: string;
  success: string;
  warning: string;
  info: string;

  // UI accents
  glassBg: string;
  inputBg: string;
  divider: string;
  headerBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  statusBarStyle: 'light' | 'dark';
}

const SharedColors = {
  primary: '#6366f1',      // Indigo accent
  primaryDark: '#4f46e5',
  riskLow: '#10b981',      // Emerald Green
  riskModerate: '#f59e0b', // Amber/Yellow
  riskHigh: '#f97316',     // Orange
  riskSevere: '#ef4444',   // Red
  sosRed: '#dc2626',
  sosGlow: '#f87171',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const DarkTheme: ThemeColors = {
  ...SharedColors,
  background: '#0f172a',   // Deep slate / dark background
  card: '#1e293b',         // Surface container
  cardBorder: '#334155',
  text: '#f8fafc',         // Primary text
  textMuted: '#94a3b8',    // Muted text
  textSubtle: '#64748b',
  glassBg: 'rgba(30, 41, 59, 0.85)',
  inputBg: '#0f172a',
  divider: '#1e293b',
  headerBg: '#1e293b',
  tabBarBg: '#1e293b',
  tabBarBorder: '#334155',
  statusBarStyle: 'light',
};

export const LightTheme: ThemeColors = {
  ...SharedColors,
  background: '#f8fafc',   // Soft light slate background
  card: '#ffffff',         // Clean white card surface
  cardBorder: '#e2e8f0',   // Light border
  text: '#0f172a',         // High-contrast dark text
  textMuted: '#64748b',    // Slate muted text
  textSubtle: '#94a3b8',   // Subtle light gray
  glassBg: 'rgba(255, 255, 255, 0.9)',
  inputBg: '#f1f5f9',
  divider: '#e2e8f0',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
  tabBarBorder: '#e2e8f0',
  statusBarStyle: 'dark',
};

// Default fallback Colors
export const Colors: ThemeColors = DarkTheme;

export const RiskColors = {
  LOW: SharedColors.riskLow,
  MODERATE: SharedColors.riskModerate,
  HIGH: SharedColors.riskHigh,
  SEVERE: SharedColors.riskSevere,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};
