import { capRole, cappedSize, fitHeight, getLayout, inset, screenPadding, textRole } from './layout';
import theme from './theme';

const phone = (width: number, height: number, fontScale = 1) => getLayout({ width, height, fontScale });

describe('getLayout', () => {
  it.each([
    [375, 667, 'compact', true],
    [375, 812, 'compact', false],
    [393, 852, 'regular', false],
    [402, 874, 'regular', false],
    [428, 926, 'large', false],
    [440, 956, 'large', false],
  ])('puts a %ipt × %ipt phone in the %s class (short: %s)', (width, height, sizeClass, isShort) => {
    expect(phone(width, height)).toMatchObject({ sizeClass, isShort });
  });

  it.each([
    [1, false, false],
    [1.12, false, false],
    [1.235, true, false],
    [1.353, true, false],
    [1.647, true, true],
  ])('reads a text scale of %d as large: %s, accessibility: %s', (fontScale, isLargeText, isAccessibilityText) => {
    expect(phone(393, 852, fontScale)).toMatchObject({ isLargeText, isAccessibilityText });
  });
});

describe('inset', () => {
  it('keeps the design value at the regular width and adjusts it on narrow and wide phones', () => {
    expect(inset(20, phone(393, 852))).toBe(20);
    expect(inset(20, phone(375, 667))).toBe(16);
    expect(inset(20, phone(440, 956))).toBe(22);
    expect(screenPadding(phone(375, 812))).toBe(16);
  });
});

describe('text scaling', () => {
  it('leaves a size alone up to the cap and holds the rendered size at the cap beyond it', () => {
    expect(cappedSize(20, 1.3, { fontScale: 1.2 })).toBe(20);
    expect(cappedSize(20, 1.3, { fontScale: 2.6 }) * 2.6).toBeCloseTo(26);
  });

  it('caps headings but lets body text follow the system size', () => {
    const huge = { fontScale: 3 };

    expect(textRole('display', huge).fontSize * huge.fontScale).toBeCloseTo(theme.fontSizes.display * 1.3);
    expect(textRole('display', huge).lineHeight * huge.fontScale).toBeCloseTo(theme.lineHeights.display * 1.3);
    expect(textRole('bodyLg', huge)).toEqual({
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
    });
    expect(capRole('display', 40, huge) * huge.fontScale).toBeCloseTo(52);
    expect(capRole('bodyLg', 40, huge)).toBe(40);
    expect(textRole('titleLg', { fontScale: 1 })).toEqual({
      fontSize: theme.fontSizes.titleLg,
      lineHeight: theme.lineHeights.titleLg,
    });
  });
});

describe('fitHeight', () => {
  it('is as tall as the fixed height at the default text size', () => {
    const style = fitHeight(52, theme.lineHeights.bodyLg);

    expect(style).toEqual({ minHeight: 52, paddingVertical: 15 });
    expect((style.paddingVertical as number) * 2 + theme.lineHeights.bodyLg).toBe(52);
  });

  it('counts the border inside the height', () => {
    expect(fitHeight(40, 20, 1)).toEqual({ minHeight: 40, paddingVertical: 9 });
  });
});
