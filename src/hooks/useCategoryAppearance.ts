import { useCallback } from 'react';

import type { CategoryColor } from '@shared/categoryColors';
import { resolveCategoryAppearance } from '@shared/categoryAppearance';
import useTheme from './useTheme';

// The active theme's look of a category colour, preset or custom.
const useCategoryAppearance = () => {
  const { colorTheme } = useTheme();

  return useCallback((color: CategoryColor) => resolveCategoryAppearance(colorTheme, color), [colorTheme]);
};

export default useCategoryAppearance;
