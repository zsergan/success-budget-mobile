import type { ViewStyle } from 'react-native';

import { AppColor } from '@shared/enums';

export const horizontalScreenPadding = 20;

export type ColorSchemeName = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  elevated: string;
  text: string;
  muted: string;
  // Below muted: chart annotations such as the zero mark.
  faint: string;
  placeholder: string;
  accent: string;
  onAccent: string;
  // A deeper amber: the second series beside `accent` in the limit allocation bar.
  accentDeep: string;
  secondary: string;
  onSecondary: string;
  // The bottom tab bar; a raised surface in the dark theme, where it is not separated by a shadow.
  tabBar: string;
  track: string;
  hairline: string;
  danger: string;
  onDanger: string;
  // A confirmation's actions, as in Overlays and Feedback.dc.html: the destructive one, with a label that passes AA,
  // and the inverted neutral one, which stays visible on the sheet in the dark theme.
  destructive: string;
  onDestructive: string;
  neutral: string;
  onNeutral: string;
  // The outline of a confirmation's secondary action and of a toast; the dark hairline does not show on elevated.
  line: string;
  ok: string;
  onOk: string;
  warn: string;
  // A toast's type mark, as in Overlays and Feedback.dc.html: success and warning fills, and the sign drawn on any fill.
  toastOk: string;
  toastWarn: string;
  onToastMark: string;
  // Tinted message surfaces, as in Auth & Settings.dc.html.
  dangerSoft: string;
  dangerBorder: string;
  dangerText: string;
  warnSoft: string;
  warnBorder: string;
  warnText: string;
  okSoft: string;
  okBorder: string;
  okText: string;
  // A tint laid over whatever surface is below a destructive button, as in Categories.dc.html.
  dangerTint: string;
  focusRing: string;
  focusRingError: string;
  // The check drawn on a solid category swatch.
  onSwatch: string;
  chartOther: string;
  chartDeleted: string;
  shadow: string;
}

export interface ThemeElevation {
  // Elevation 1 (card) and 2 (modal), per Foundation.dc.html.
  card: ViewStyle;
  modal: ViewStyle;
  // The raised segment of a segmented control.
  segment: ViewStyle;
  fab: ViewStyle;
  // The large primary button's glow; the dark theme drops it.
  accentGlow: ViewStyle;
  // Lighter than `modal`, which suits a sheet rather than a small floating surface.
  toast: ViewStyle;
}

export interface WalletAppearance {
  gradient: [string, string];
  fg: string;
  dim: string;
  // The translucent tint behind the Income/Expense boxes inside the card.
  inner: string;
}

export interface CategoryAppearance {
  stroke: string;
  tint: string;
}

export interface ColorTheme {
  scheme: ColorSchemeName;
  colors: ThemeColors;
  elevation: ThemeElevation;
  wallets: Record<AppColor, WalletAppearance>;
  categories: Record<AppColor, CategoryAppearance>;
}

const lightColors: ThemeColors = {
  bg: '#F6F7F9',
  surface: '#FCFDFE',
  elevated: '#FFFFFF',
  text: '#1D2430',
  muted: '#798393',
  faint: '#AAB2BE',
  placeholder: '#A6AEBA',
  accent: '#FFB020',
  onAccent: '#231704',
  accentDeep: '#8A5406',
  secondary: '#1D2430',
  onSecondary: '#FCFDFE',
  tabBar: '#F6F7F9',
  track: '#E3E7EC',
  hairline: '#E3E7EC',
  danger: '#E04F3D',
  onDanger: '#FFFDFA',
  destructive: '#C3392A',
  onDestructive: '#FFFFFF',
  neutral: '#1D2430',
  onNeutral: '#FCFDFE',
  line: '#E3E7EC',
  ok: '#3FAE6A',
  onOk: '#FFFDFA',
  warn: '#F0A92A',
  toastOk: '#23724A',
  toastWarn: '#8A5806',
  onToastMark: '#FFFFFF',
  dangerSoft: '#FDECEA',
  dangerBorder: '#F3C8C1',
  dangerText: '#8D3428',
  warnSoft: '#FFF6E4',
  warnBorder: '#F4DFB0',
  warnText: '#8A5806',
  okSoft: '#E9F6EE',
  okBorder: '#C2E5CF',
  okText: '#276B45',
  dangerTint: 'rgba(224,79,61,0.09)',
  focusRing: 'rgba(255,176,32,0.28)',
  focusRingError: 'rgba(224,79,61,0.16)',
  onSwatch: '#FFFFFF',
  chartOther: '#8B95A3',
  chartDeleted: '#C3C9D2',
  shadow: '#1D2430',
};

const darkColors: ThemeColors = {
  bg: '#0E1218',
  surface: '#161C25',
  elevated: '#1F2733',
  text: '#F2F4F8',
  muted: '#8794A8',
  faint: '#4F5A6C',
  placeholder: '#5D6A7C',
  accent: '#FFB020',
  onAccent: '#1C1201',
  accentDeep: '#8A5406',
  secondary: '#1F2733',
  onSecondary: '#F2F4F8',
  tabBar: '#1F2733',
  track: '#252E3B',
  hairline: '#222A35',
  danger: '#F2695A',
  onDanger: '#FFFDFA',
  destructive: '#F2695A',
  onDestructive: '#1C0F0D',
  neutral: '#F2F4F8',
  onNeutral: '#0E1218',
  line: '#252E3B',
  ok: '#4DC07B',
  onOk: '#0C1A11',
  warn: '#F7BD4D',
  toastOk: '#4DC07B',
  toastWarn: '#F7BD4D',
  onToastMark: '#0E1218',
  dangerSoft: '#2A1A18',
  dangerBorder: '#4C2B26',
  dangerText: '#F0A79C',
  warnSoft: '#2B2110',
  warnBorder: '#4D3A15',
  warnText: '#F0CD8A',
  okSoft: '#12261B',
  okBorder: '#26492F',
  okText: '#8FD8AB',
  dangerTint: 'rgba(242,105,90,0.14)',
  focusRing: 'rgba(255,176,32,0.28)',
  focusRingError: 'rgba(224,79,61,0.16)',
  onSwatch: '#0E1218',
  chartOther: '#6B7688',
  chartDeleted: '#3B4452',
  shadow: '#000000',
};

const fabElevation: ViewStyle = {
  shadowColor: lightColors.accent,
  shadowOpacity: 0.5,
  shadowOffset: { width: 0, height: 8 },
  shadowRadius: 16,
};

const lightElevation: ThemeElevation = {
  card: {
    shadowColor: lightColors.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  modal: {
    shadowColor: lightColors.shadow,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
  segment: {
    shadowColor: lightColors.shadow,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  fab: fabElevation,
  accentGlow: { boxShadow: '0 12px 26px -12px rgba(255, 176, 32, 0.7)' },
  toast: { boxShadow: '0 6px 20px -6px rgba(29, 36, 48, 0.18), 0 1px 2px rgba(29, 36, 48, 0.06)' },
};

// A shadow barely reads on a dark background, so surfaces there separate by tone and hairlines instead.
const darkElevation: ThemeElevation = {
  card: {
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  modal: {
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.75,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
  segment: {
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  fab: fabElevation,
  accentGlow: {},
  toast: { boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.6)' },
};

// Wallet-card presets, per Home Page and Wallets.dc.html (angle/stops in WalletGradientBackground.tsx).
const lightWallets: Record<AppColor, WalletAppearance> = {
  [AppColor.SLATE]: { gradient: ['#2f3a4b', '#1d2430'], fg: '#fdfdfe', dim: '#a6b1c1', inner: 'rgba(253,253,254,.09)' },
  [AppColor.AMBER]: { gradient: ['#c07d10', '#8a5406'], fg: '#fffaf0', dim: '#f0d5a6', inner: 'rgba(255,250,240,.14)' },
  [AppColor.EVERGREEN]: {
    gradient: ['#24614a', '#123528'],
    fg: '#f2fbf6',
    dim: '#9cc9b4',
    inner: 'rgba(242,251,246,.12)',
  },
  [AppColor.INDIGO]: {
    gradient: ['#36428a', '#1e2450'],
    fg: '#f4f5ff',
    dim: '#a8afdd',
    inner: 'rgba(244,245,255,.12)',
  },
  [AppColor.CLAY]: { gradient: ['#984034', '#5e2419'], fg: '#fff5f2', dim: '#e0b0a4', inner: 'rgba(255,245,242,.13)' },
  [AppColor.PLUM]: { gradient: ['#66305f', '#3a1a36'], fg: '#fdf3fc', dim: '#cfa8c9', inner: 'rgba(253,243,252,.13)' },
};

const darkWallets: Record<AppColor, WalletAppearance> = {
  [AppColor.SLATE]: { gradient: ['#1a2230', '#0f1520'], fg: '#f2f4f8', dim: '#8794a8', inner: 'rgba(255,176,32,.12)' },
  [AppColor.AMBER]: { gradient: ['#5d3a05', '#331f02'], fg: '#ffe6b8', dim: '#c69a52', inner: 'rgba(255,200,107,.14)' },
  [AppColor.EVERGREEN]: {
    gradient: ['#12352a', '#0a1e18'],
    fg: '#d6f0e2',
    dim: '#6f9d87',
    inner: 'rgba(77,192,123,.14)',
  },
  [AppColor.INDIGO]: {
    gradient: ['#1c2250', '#111533'],
    fg: '#dfe2ff',
    dim: '#7d85c4',
    inner: 'rgba(143,155,255,.16)',
  },
  [AppColor.CLAY]: { gradient: ['#5a231a', '#33130e'], fg: '#fbd9d0', dim: '#b5786a', inner: 'rgba(242,105,90,.15)' },
  [AppColor.PLUM]: { gradient: ['#3a1a36', '#220f20'], fg: '#f2d6ee', dim: '#a97ba2', inner: 'rgba(217,143,208,.15)' },
};

type Rgb = [number, number, number];

// The wallet tones again, flat; see Categories.dc.html's COLORS array.
const CATEGORY_RGB: Record<ColorSchemeName, Record<AppColor, Rgb>> = {
  light: {
    [AppColor.SLATE]: [47, 58, 75],
    [AppColor.AMBER]: [180, 114, 13],
    [AppColor.EVERGREEN]: [36, 97, 74],
    [AppColor.INDIGO]: [54, 66, 138],
    [AppColor.CLAY]: [152, 64, 47],
    [AppColor.PLUM]: [102, 48, 95],
  },
  dark: {
    [AppColor.SLATE]: [147, 163, 189],
    [AppColor.AMBER]: [240, 180, 85],
    [AppColor.EVERGREEN]: [95, 174, 140],
    [AppColor.INDIGO]: [143, 155, 224],
    [AppColor.CLAY]: [224, 139, 118],
    [AppColor.PLUM]: [207, 143, 198],
  },
};

const CATEGORY_TINT_ALPHA: Record<ColorSchemeName, number> = { light: 0.1, dark: 0.16 };

const buildCategories = (scheme: ColorSchemeName) =>
  Object.fromEntries(
    Object.values(AppColor).map((color) => {
      const [r, g, b] = CATEGORY_RGB[scheme][color];

      return [color, { stroke: `rgb(${r},${g},${b})`, tint: `rgba(${r},${g},${b},${CATEGORY_TINT_ALPHA[scheme]})` }];
    }),
  ) as Record<AppColor, CategoryAppearance>;

export const colorThemes: Record<ColorSchemeName, ColorTheme> = {
  light: {
    scheme: 'light',
    colors: lightColors,
    elevation: lightElevation,
    wallets: lightWallets,
    categories: buildCategories('light'),
  },
  dark: {
    scheme: 'dark',
    colors: darkColors,
    elevation: darkElevation,
    wallets: darkWallets,
    categories: buildCategories('dark'),
  },
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

export default theme;
