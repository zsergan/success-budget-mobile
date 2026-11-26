import { AppColor } from '@shared/enums';
import {
  categoryColorName,
  isCustomColor,
  isPresetColor,
  normalizeCategoryColor,
  readCategoryColor,
} from './categoryColors';

describe('category colours', () => {
  it('keeps every preset as it is', () => {
    Object.values(AppColor).forEach((color) => {
      expect(isPresetColor(color)).toBe(true);
      expect(normalizeCategoryColor(color)).toBe(color);
    });
  });

  it('stores a custom colour upper-case, like the server', () => {
    expect(isCustomColor('#3a7bd5')).toBe(true);
    expect(normalizeCategoryColor('#3a7bd5')).toBe('#3A7BD5');
    expect(normalizeCategoryColor('#0F8F8A')).toBe('#0F8F8A');
  });

  it.each(['#RGB', '#3A7', '#3A7BD5FF', '3A7BD5', 'red', 'rgb(1,2,3)', 'Slate', ' #3A7BD5', '', null, 7])(
    'refuses %j',
    (value) => {
      expect(normalizeCategoryColor(value)).toBeNull();
    },
  );

  it('reads an unknown value as the neutral preset', () => {
    expect(readCategoryColor('teal')).toBe(AppColor.SLATE);
    expect(readCategoryColor('#c2416b')).toBe('#C2416B');
  });

  it('names a preset by name and a custom colour by its value', () => {
    expect(categoryColorName(AppColor.CLAY)).toBe('Clay');
    expect(categoryColorName('#0F8F8A')).toBe('Custom · #0F8F8A');
  });
});
