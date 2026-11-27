import type { ViewStyle } from 'react-native';

import theme from '@shared/theme';

// Width classes of the phones the layout is checked on: 375pt (SE, mini), 390-402pt (the base models and Pro),
// 428-440pt (Plus and Pro Max).
export type SizeClass = 'compact' | 'regular' | 'large';

const COMPACT_MAX_WIDTH = 389;
const LARGE_MIN_WIDTH = 428;
// A phone with a home button (SE, 667pt) has no room to spare under the status bar and above the bottom edge.
const SHORT_MAX_HEIGHT = 700;

// iOS text sizes: XXL is 1.24, the largest standard one (XXXL) 1.35, the first accessibility one (AX1) 1.65.
export const LARGE_TEXT_SCALE = 1.15;
export const ACCESSIBILITY_TEXT_SCALE = 1.6;

export interface Layout {
  width: number;
  height: number;
  fontScale: number;
  sizeClass: SizeClass;
  isShort: boolean;
  isLargeText: boolean;
  isAccessibilityText: boolean;
}

export const getLayout = ({
  width,
  height,
  fontScale,
}: {
  width: number;
  height: number;
  fontScale: number;
}): Layout => ({
  width,
  height,
  fontScale,
  sizeClass: width <= COMPACT_MAX_WIDTH ? 'compact' : width >= LARGE_MIN_WIDTH ? 'large' : 'regular',
  isShort: height <= SHORT_MAX_HEIGHT,
  isLargeText: fontScale > LARGE_TEXT_SCALE,
  isAccessibilityText: fontScale > ACCESSIBILITY_TEXT_SCALE,
});

// The design is drawn at the regular width: a narrow phone takes a little off its insets, a wide one adds a little.
const INSET_FACTOR: Record<SizeClass, number> = { compact: 0.8, regular: 1, large: 1.1 };

export const inset = (designValue: number, { sizeClass }: Pick<Layout, 'sizeClass'>) =>
  Math.round(designValue * INSET_FACTOR[sizeClass]);

export const screenPadding = (layout: Pick<Layout, 'sizeClass'>) => inset(theme.spacing.xl, layout);

export type FontRole = keyof typeof theme.fontSizes;

// Headings would push everything else off the screen at accessibility sizes; body text keeps the system's scale.
const FONT_SCALE_CAPS: Partial<Record<FontRole, number>> = {
  display: 1.3,
  titleLg: 1.3,
  titleMd: 1.6,
  titleSm: 1.6,
};

// The size to give a style so that, once the system scales it, the text is at most `cap` times the design size.
export const cappedSize = (size: number, cap: number, { fontScale }: Pick<Layout, 'fontScale'>) =>
  fontScale > cap ? (size * cap) / fontScale : size;

// A size drawn in a role's place (an amount, a line height of its own) takes that role's cap.
export const capRole = (role: FontRole, size: number, layout: Pick<Layout, 'fontScale'>) =>
  cappedSize(size, FONT_SCALE_CAPS[role] ?? Infinity, layout);

export const textRole = (role: FontRole, layout: Pick<Layout, 'fontScale'>) => ({
  fontSize: capRole(role, theme.fontSizes[role], layout),
  lineHeight: capRole(role, theme.lineHeights[role], layout),
});

// A one-line control `height` tall at the default text size that grows with its label instead of clipping it.
// The border is part of the height, as it is with a fixed one.
export const fitHeight = (height: number, lineHeight: number, borderWidth = 0): ViewStyle => ({
  minHeight: height,
  paddingVertical: Math.max(0, (height - lineHeight) / 2 - borderWidth),
});
