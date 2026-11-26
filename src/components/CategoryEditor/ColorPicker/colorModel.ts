import type { CustomColor } from '@shared/categoryColors';
import { normalizeCategoryColor, isCustomColor } from '@shared/categoryColors';

// Hue in degrees (0–360), saturation and value from 0 to 1.
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toHex = (channel: number) =>
  Math.round(clamp(channel, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

export const hsvToHex = ({ h, s, v }: Hsv): CustomColor => {
  const hue = ((h % 360) + 360) % 360;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - chroma;
  const [r, g, b] =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  return `#${toHex(r + m)}${toHex(g + m)}${toHex(b + m)}`;
};

export const hexToHsv = (hex: CustomColor): Hsv => {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = 0;

  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max ? delta / max : 0, v: max };
};

// What the HEX field holds while typed: a leading # and at most six hex digits, upper-case.
export const cleanHexInput = (text: string) =>
  `#${text
    .replace(/[^0-9a-fA-F]/g, '')
    .slice(0, 6)
    .toUpperCase()}`;

// A complete #RRGGBB as the server stores it, or null while the field is still incomplete.
export const parseHexInput = (text: string): CustomColor | null => {
  const color = normalizeCategoryColor(text.trim());

  return color && isCustomColor(color) ? color : null;
};

// The hue spectrum, in the order a hue bar shows it; a gradient takes at least two stops.
export const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360].map((h) => hsvToHex({ h, s: 1, v: 1 })) as [
  CustomColor,
  CustomColor,
  ...CustomColor[],
];

// A theme's `rgb(r,g,b)` tone as the #RRGGBB the picker starts from.
export const rgbToHex = (css: string): CustomColor | null => {
  const channels = css.match(/\d+/g)?.slice(0, 3).map(Number);

  return channels?.length === 3 ? (`#${channels.map((value) => toHex(value / 255)).join('')}` as CustomColor) : null;
};
