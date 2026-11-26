import type { CategoryColor } from '@shared/categoryColors';
import { isCustomColor, isPresetColor } from '@shared/categoryColors';
import { AppColor } from '@shared/enums';
import type { CategoryAppearance, ColorTheme, Rgb } from '@shared/theme';
import { categoryAppearanceOf } from '@shared/theme';

// A glyph must stand out from the surface it sits on; see Categories.dc.html, "Custom colour".
const MIN_CONTRAST = 3;
const MIX_STEP = 0.12;
const MAX_STEPS = 20;

const toRgb = (hex: string): Rgb => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) as Rgb;

const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: Rgb, b: Rgb) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (lighter + 0.05) / (darker + 0.05);
};

// The saved colour as it is, unless it is under 3:1 against the theme's surface: then it is mixed toward black (light
// theme) or white (dark theme) in 12% steps until it passes. A grey stays grey; the saved value never changes.
export const customGlyphRgb = (hex: string, { scheme, colors }: Pick<ColorTheme, 'scheme' | 'colors'>): Rgb => {
  const surface = toRgb(colors.surface);
  const target = scheme === 'dark' ? 255 : 0;
  let rgb = toRgb(hex);

  for (let step = 0; step < MAX_STEPS && contrastRatio(rgb, surface) < MIN_CONTRAST; step += 1) {
    rgb = rgb.map((value) => Math.round(value + (target - value) * MIX_STEP)) as Rgb;
  }

  return rgb;
};

const customAppearances = new Map<string, CategoryAppearance>();

// One look for a category wherever it is drawn: its glyph and bars in `stroke`, its tile in `tint`. A preset takes the
// theme's own tones; a custom colour takes its saved RGB, adjusted for contrast with the theme.
export const resolveCategoryAppearance = (colorTheme: ColorTheme, color: CategoryColor): CategoryAppearance => {
  if (isPresetColor(color)) return colorTheme.categories[color];
  if (!isCustomColor(color)) return colorTheme.categories[AppColor.SLATE];

  const key = `${colorTheme.scheme}:${color.toUpperCase()}`;
  let appearance = customAppearances.get(key);

  if (!appearance) {
    appearance = categoryAppearanceOf(customGlyphRgb(color, colorTheme), colorTheme.scheme);
    customAppearances.set(key, appearance);
  }

  return appearance;
};
