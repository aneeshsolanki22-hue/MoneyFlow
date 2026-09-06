export const HOME_GRADIENTS = {
  /** navy top → cyan bottom glow (default look) */
  ocean: ['#020024', '#00d4ff'],
  /** dark red → orange → dark red (brand look, orange glow in the middle) */
  ember: ['#9e0f0d', '#e15c15', '#9e0f0d'],
  /** “Under Blue Green” (uigradients.com), reversed: lime → green → teal → deep navy */
  lagoon: ['#a8eb12', '#00bf72', '#008793', '#004d7a', '#051937'],
  /** “eXpresso” (uigradients.com), reversed: deep purple → magenta */
  expresso: ['#3c1053', '#ad5389'],
} as const;

export const DarkColors = {
  bgSolid: '#000000',
  card: '#1a1a1a',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.06)',
  whiteHi: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  accent: '#FF8A3D',
};

export const LightColors = {
  bgSolid: '#F0F5FB',
  card: '#FFFFFF',
  cardBorder: 'rgba(11, 11, 18, 0.06)',
  border: 'rgba(11, 11, 18, 0.08)',
  whiteHi: '#FFFFFF',
  textPrimary: '#0B0B12',
  textDim: 'rgba(11, 11, 18, 0.6)',
  textMuted: 'rgba(11, 11, 18, 0.45)',
  accent: '#FF8A3D',
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
};