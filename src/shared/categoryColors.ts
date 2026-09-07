import { AppColor } from '@shared/enums';
import { colorScheme } from '@shared/theme';

type Rgb = [number, number, number];

// Same six tones as the wallet gradient presets, but flat (no gradient) — see Categories Stage 5.dc.html's COLORS array.
const CATEGORY_COLOR_RGB: Record<AppColor, { light: Rgb; dark: Rgb }> = {
  [AppColor.SLATE]: { light: [47, 58, 75], dark: [147, 163, 189] },
  [AppColor.AMBER]: { light: [180, 114, 13], dark: [240, 180, 85] },
  [AppColor.EVERGREEN]: { light: [36, 97, 74], dark: [95, 174, 140] },
  [AppColor.INDIGO]: { light: [54, 66, 138], dark: [143, 155, 224] },
  [AppColor.CLAY]: { light: [152, 64, 47], dark: [224, 139, 118] },
  [AppColor.PLUM]: { light: [102, 48, 95], dark: [207, 143, 198] },
};

const rgb = ([r, g, b]: Rgb) => `rgb(${r},${g},${b})`;
const rgba = ([r, g, b]: Rgb, alpha: number) => `rgba(${r},${g},${b},${alpha})`;

export const getCategoryStroke = (color: AppColor): string => rgb(CATEGORY_COLOR_RGB[color][colorScheme]);

export const getCategoryTint = (color: AppColor): string =>
  rgba(CATEGORY_COLOR_RGB[color][colorScheme], colorScheme === 'dark' ? 0.16 : 0.1);

export const CATEGORY_COLOR_NAMES: Record<AppColor, string> = {
  [AppColor.SLATE]: 'Slate',
  [AppColor.AMBER]: 'Amber',
  [AppColor.EVERGREEN]: 'Evergreen',
  [AppColor.INDIGO]: 'Indigo',
  [AppColor.CLAY]: 'Clay',
  [AppColor.PLUM]: 'Plum',
};

export const CATEGORY_COLOR_ORDER: AppColor[] = [
  AppColor.SLATE,
  AppColor.AMBER,
  AppColor.EVERGREEN,
  AppColor.INDIGO,
  AppColor.CLAY,
  AppColor.PLUM,
];
