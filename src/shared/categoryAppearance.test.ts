import { AppColor } from '@shared/enums';
import { colorThemes } from '@shared/theme';
import { contrastRatio, customGlyphRgb, resolveCategoryAppearance } from './categoryAppearance';

const { light, dark } = colorThemes;
const rgbOf = (css: string) => css.match(/\d+/g)!.slice(0, 3).map(Number) as [number, number, number];
const surfaceOf = (hex: string) =>
  [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];

describe('resolveCategoryAppearance', () => {
  it('takes a preset from the theme', () => {
    Object.values(AppColor).forEach((color) => {
      expect(resolveCategoryAppearance(light, color)).toBe(light.categories[color]);
      expect(resolveCategoryAppearance(dark, color)).toBe(dark.categories[color]);
    });
  });

  it('draws a custom colour with enough contrast as saved, its tile in the same tone', () => {
    expect(resolveCategoryAppearance(light, '#0F8F8A')).toEqual({
      stroke: 'rgb(15,143,138)',
      tint: 'rgba(15,143,138,0.1)',
    });
    expect(resolveCategoryAppearance(dark, '#C2416B')).toEqual({
      stroke: 'rgb(194,65,107)',
      tint: 'rgba(194,65,107,0.16)',
    });
  });

  it('draws a value it does not know in the neutral preset', () => {
    expect(resolveCategoryAppearance(light, 'teal' as AppColor)).toBe(light.categories[AppColor.SLATE]);
  });

  it('reads a custom colour in any case as the same colour', () => {
    expect(resolveCategoryAppearance(light, '#0f8f8a')).toEqual(resolveCategoryAppearance(light, '#0F8F8A'));
  });

  it.each([
    ['an almost white colour, light theme', '#F4F1EA', light],
    ['an almost black colour, dark theme', '#101010', dark],
    ['a dark purple, dark theme', '#3A1E5C', dark],
    ['a pale yellow, light theme', '#FFF5B0', light],
  ])('adjusts %s until it stands out from the surface', (_name, hex, theme) => {
    const glyph = rgbOf(resolveCategoryAppearance(theme, hex as `#${string}`).stroke);

    expect(contrastRatio(glyph, surfaceOf(theme.colors.surface))).toBeGreaterThanOrEqual(3);
    expect(glyph).not.toEqual(surfaceOf(hex));
  });

  it('darkens toward black in the light theme and lightens toward white in the dark one', () => {
    const [r, g, b] = customGlyphRgb('#F4F1EA', light);
    expect(r + g + b).toBeLessThan(0xf4 + 0xf1 + 0xea);

    const [dr, dg, db] = customGlyphRgb('#3A1E5C', dark);
    expect(dr + dg + db).toBeGreaterThan(0x3a + 0x1e + 0x5c);
  });

  it('keeps a grey grey', () => {
    const [r, g, b] = customGlyphRgb('#EEEEEE', light);

    expect(r).toBe(g);
    expect(g).toBe(b);
  });
});
