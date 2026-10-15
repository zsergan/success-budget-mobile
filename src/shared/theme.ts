export const horizontalScreenPadding = 20;

// Both schemes are defined so a theme switcher only has to change `colorScheme`.
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
    placeholder: '#A6AEBA',
    danger: '#E04F3D',
    ok: '#3FAE6A',
    warn: '#F0A92A',
    // Tinted message surfaces, as in Auth & Settings.dc.html.
    dangerSoft: '#FDECEA',
    dangerBorder: '#F3C8C1',
    dangerText: '#8D3428',
    warnSoft: '#FFF6E4',
    warnBorder: '#F4DFB0',
    warnText: '#8A5806',
    okSoft: '#E9F6EE',
    okBorder: '#C2E5CF',
    okText: '#276B45',
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
    placeholder: '#5D6A7C',
    danger: '#F2695A',
    ok: '#4DC07B',
    warn: '#F7BD4D',
    dangerSoft: '#2A1A18',
    dangerBorder: '#4C2B26',
    dangerText: '#F0A79C',
    warnSoft: '#2B2110',
    warnBorder: '#4D3A15',
    warnText: '#F0CD8A',
    okSoft: '#12261B',
    okBorder: '#26492F',
    okText: '#8FD8AB',
  },
} as const;

// Fixed until there is a theme switcher; exported so paired token sets (e.g. wallet gradients) follow it.
export const colorScheme: keyof typeof colorTokens = 'light';

export const colors = colorTokens[colorScheme];

// A fixed dark scrim color, independent of colorScheme (the modal backdrop should stay dark even under a light theme).
export const palette = {
  black: '#1D2430',
};

const theme = {
  fonts: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
  },
  // fontSizes/lineHeights/letterSpacing are parallel maps keyed by the same token names.
  fontSizes: {
    display: 38,
    titleLg: 28,
    titleMd: 22,
    titleSm: 20,
    bodyLg: 16,
    label: 14,
    bodySm: 13,
    caption: 12,
    micro: 11,
  },
  lineHeights: {
    display: 40,
    titleLg: 34,
    titleMd: 28,
    titleSm: 26,
    bodyLg: 22,
    label: 20,
    bodySm: 19,
    caption: 16,
    micro: 14,
  },
  // Only steps with non-zero tracking in the design; the rest use the platform default.
  letterSpacing: {
    display: -1.2,
    titleLg: -0.6,
    titleMd: -0.3,
    titleSm: -0.2,
    micro: 0.6,
  },
  radius: {
    sm: 12,
    md: 14,
    lg: 20,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
};

// Elevation 1 (card), per Foundation.dc.html.
export const shadow: Record<string, unknown> = {
  shadowColor: colors.text,
  shadowOpacity: 0.15,
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowRadius: 10,
};

// Elevation 2 (modal).
export const shadowModal: Record<string, unknown> = {
  shadowColor: colors.text,
  shadowOpacity: 0.28,
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowRadius: 24,
};

export default theme;
