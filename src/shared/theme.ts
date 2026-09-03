export const horizontalScreenPadding = 20;

/**
 * General UI color tokens — "Slate & Amber" (design stage 2), with full
 * light/dark parity as specified by the design so stage 8 (theme
 * switching) can wire this up without redefining the values. `colorScheme`
 * below is the only thing hardcoded for now — no switcher exists yet.
 */
const colorTokens = {
  light: {
    bg: '#F6F7F9',
    surface: '#FCFDFE',
    elevated: '#FFFFFF',
    text: '#1D2430',
    muted: '#798393',
    accent: '#FFB020',
    onAccent: '#231704',
    secondary: '#1D2430',
    onSecondary: '#FCFDFE',
    track: '#E3E7EC',
    hairline: '#E3E7EC',
    danger: '#E04F3D',
    ok: '#3FAE6A',
    warn: '#F0A92A',
  },
  dark: {
    bg: '#0E1218',
    surface: '#161C25',
    elevated: '#1F2733',
    text: '#F2F4F8',
    muted: '#8794A8',
    accent: '#FFB020',
    onAccent: '#1C1201',
    secondary: '#1F2733',
    onSecondary: '#F2F4F8',
    track: '#252E3B',
    hairline: '#222A35',
    danger: '#F2695A',
    ok: '#4DC07B',
    warn: '#F7BD4D',
  },
} as const;

// Hardcoded until design stage 8 adds an actual switcher (system
// Appearance / user setting) and makes this dynamic.
const colorScheme: keyof typeof colorTokens = 'light';

export const colors = colorTokens[colorScheme];

/**
 * Wallet-card gradient colors (`WalletDesign`) — old design, kept exactly
 * as-is on purpose. Design stage 6 replaces this whole system with 6
 * curated presets (slate/amber/evergreen/indigo/clay/plum), each with its
 * own light/dark pair; recoloring these now would be throwaway work.
 */
export const palette = {
  yellow: '#FFC55A',
  yellowLight: '#FFD78D',
  greenDark: '#57C84D',
  green: '#5BDA8C',
  blue: '#5078F2',
  blueLight: '#EFE9F4',
  red: '#FC4100',
  redLight: '#FF7878',
  pink: '#C86FC9',
  pinkLight: '#F79AD3',
  // Also used outside the wallet-gradient system, by the (unrelated)
  // category color picker — see CreateCategoryScreen.tsx.
  black: '#1D2430',
};

const theme = {
  fonts: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    bold: 'PlusJakartaSans-Bold',
  },
  /**
   * Font sizes.
   * @property xs - 12
   * @property sm - 16
   * @property md - 20
   * @property lg - 28
   * @property xl - 48
   */
  fontSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 28,
    xl: 48,
  },
  /**
   * Radius sizes.
   * @property sm - 12
   * @property lg - 20
   */
  radius: {
    sm: 12,
    lg: 20,
  },
  /**
   * Spacing sizes for margins and paddings.
   * @property xs - 4
   * @property sm - 8
   * @property md - 12
   * @property lg - 16
   * @property xl - 20
   * @property xxl - 24
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
};

export const shadow: Record<string, unknown> = {
  shadowColor: colors.text,
  shadowOpacity: 0.15,
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowRadius: 10,
};

export default theme;
