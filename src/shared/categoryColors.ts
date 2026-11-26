import { AppColor } from '@shared/enums';

// A category's colour as the API stores it: one of the six presets, or any opaque custom `#RRGGBB` (upper-case).
// `AppColor` stays the preset palette, which member avatars use too.
export type CustomColor = `#${string}`;
export type CategoryColor = AppColor | CustomColor;

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

const PRESETS: ReadonlySet<string> = new Set(Object.values(AppColor));
const HEX = /^#[0-9A-Fa-f]{6}$/;

export const isPresetColor = (color: unknown): color is AppColor => typeof color === 'string' && PRESETS.has(color);

export const isCustomColor = (color: unknown): color is CustomColor => typeof color === 'string' && HEX.test(color);

// The stored form, as the server keeps it: a preset as it is, a custom colour upper-case; null for anything else.
export const normalizeCategoryColor = (value: unknown): CategoryColor | null => {
  if (isPresetColor(value)) return value;

  return isCustomColor(value) ? (value.toUpperCase() as CustomColor) : null;
};

// What a read is drawn with: an unknown value from a newer server falls back to the neutral preset.
export const readCategoryColor = (value: unknown): CategoryColor => normalizeCategoryColor(value) ?? AppColor.SLATE;

// "Clay", or "Custom · #0F8F8A".
export const categoryColorName = (color: CategoryColor) =>
  isPresetColor(color) ? CATEGORY_COLOR_NAMES[color] : `Custom · ${color}`;
