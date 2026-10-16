import type { ColorTheme } from '@shared/theme';

import useTheme from './useTheme';

export type ThemedStyleFactory<T> = (theme: ColorTheme) => T;

const cache = new WeakMap<ThemedStyleFactory<unknown>, Map<ColorTheme, unknown>>();

// A factory runs once per theme; every component using it shares the result until the theme changes.
export const getThemedStyles = <T>(factory: ThemedStyleFactory<T>, theme: ColorTheme): T => {
  let byTheme = cache.get(factory);
  if (!byTheme) {
    byTheme = new Map();
    cache.set(factory, byTheme);
  }

  if (!byTheme.has(theme)) byTheme.set(theme, factory(theme));

  return byTheme.get(theme) as T;
};

const useThemedStyles = <T>(factory: ThemedStyleFactory<T>): T => getThemedStyles(factory, useTheme().colorTheme);

export default useThemedStyles;
