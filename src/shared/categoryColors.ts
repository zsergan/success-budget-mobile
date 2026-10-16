import { AppColor } from '@shared/enums';
import { colorScheme, colorThemes } from '@shared/theme';

const categoryAppearance = colorThemes[colorScheme].categories;

export const getCategoryStroke = (color: AppColor): string => categoryAppearance[color].stroke;

export const getCategoryTint = (color: AppColor): string => categoryAppearance[color].tint;

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
