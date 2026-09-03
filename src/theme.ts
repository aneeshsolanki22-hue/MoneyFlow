export const HOME_GRADIENTS = {
  /** navy top → cyan bottom glow (default look) */
  ocean: ['#020024', '#00d4ff'],
  /** dark red top → orange bottom (brand look) */
  ember: ['#9e0f0d', '#e15c15'],
  /** “Under Blue Green” (uigradients.com): deep navy → sea teal → green → lime */
  lagoon: ['#051937', '#004d7a', '#008793', '#00bf72', '#a8eb12'],
  /** “eXpresso” (uigradients.com): magenta purple → deep purple */
  expresso: ['#ad5389', '#3c1053'],
} as const;

export const DarkColors = {
  bg: '#000000',
  bgSolid: '#000000',
  card: '#1a1a1a',
  card2: '#1a1a1a',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.06)',
  white: '#FFFFFF',
  whiteHi: '#FFFFFF',
  whiteSub: 'rgba(255, 255, 255, 0.8)',
  whiteDim: 'rgba(255, 255, 255, 0.5)',
  whiteGhost: 'rgba(255, 255, 255, 0.25)',
  textPrimary: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  textPlaceholder: 'rgba(255, 255, 255, 0.35)',
  shadowOpacity: 0.4,
  income: '#16A34A',
  incomeLight: '#4ADE80',
  incomeDark: '#059669',
  expense: '#EF4444',
  expenseLight: '#F87171',
  expenseDark: '#DC2626',
  accent: '#FF8A3D',
  accentDeep: '#E15C15',
  accentMid: '#B1330F',
  accentDark: '#9E0F0D',
  google: '#4285F4',
  sky: '#38BDF8',
  violet: '#A78BFA',
  ink: '#FFFFFF',
  inkDeep: '#000000',
  divider: 'rgba(255, 255, 255, 0.08)',
};

export const LightColors = {
  bg: '#F0F5FB',
  bgSolid: '#F0F5FB',
  card: '#FFFFFF',
  card2: '#FFFFFF',
  cardBorder: 'rgba(11, 11, 18, 0.06)',
  border: 'rgba(11, 11, 18, 0.08)',
  white: '#FFFFFF',
  whiteHi: '#FFFFFF',
  whiteSub: 'rgba(255, 255, 255, 0.8)',
  whiteDim: 'rgba(255, 255, 255, 0.6)',
  whiteGhost: 'rgba(255, 255, 255, 0.3)',
  textPrimary: '#0B0B12',
  textDim: 'rgba(11, 11, 18, 0.6)',
  textMuted: 'rgba(11, 11, 18, 0.45)',
  textPlaceholder: 'rgba(11, 11, 18, 0.35)',
  shadowOpacity: 0.08,
  income: '#059669',
  incomeLight: '#16A34A',
  incomeDark: '#047857',
  expense: '#EF4444',
  expenseLight: '#F87171',
  expenseDark: '#DC2626',
  accent: '#FF8A3D',
  accentDeep: '#E15C15',
  accentMid: '#B1330F',
  accentDark: '#9E0F0D',
  google: '#4285F4',
  sky: '#38BDF8',
  violet: '#A78BFA',
  ink: '#0B0B12',
  inkDeep: '#0B0B12',
  divider: 'rgba(11, 11, 18, 0.06)',
};

export type ThemeColors = typeof LightColors;

// Use LightColors by default for H1 Light Theme
export const Colors = LightColors;

export const Fonts = {
  // Space Grotesk
  display: 'SpaceGrotesk_700Bold',
  displaySemi: 'SpaceGrotesk_600SemiBold',
  // Inter
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};
