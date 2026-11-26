import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';

import useLayout from './useLayout';
import useTheme from './useTheme';

export type ThemedStyleFactory<T> = (theme: ColorTheme, layout: Layout) => T;

const cache = new WeakMap<ThemedStyleFactory<unknown>, Map<ColorTheme, Map<string, unknown>>>();

// A factory that ignores the layout is built once per theme, whatever the screen and text size.
const layoutKey = (factory: ThemedStyleFactory<unknown>, { sizeClass, isShort, fontScale }: Layout) =>
  factory.length < 2 ? '' : `${sizeClass}|${isShort}|${fontScale}`;

// A factory runs once per theme and layout; every component using it shares the result until either changes.
export const getThemedStyles = <T>(factory: ThemedStyleFactory<T>, theme: ColorTheme, layout: Layout): T => {
  let byTheme = cache.get(factory);
  if (!byTheme) {
    byTheme = new Map();
    cache.set(factory, byTheme);
  }

  let byLayout = byTheme.get(theme);
  if (!byLayout) {
    byLayout = new Map();
    byTheme.set(theme, byLayout);
  }

  const key = layoutKey(factory, layout);
  if (!byLayout.has(key)) byLayout.set(key, factory(theme, layout));

  return byLayout.get(key) as T;
};

const useThemedStyles = <T>(factory: ThemedStyleFactory<T>): T =>
  getThemedStyles(factory, useTheme().colorTheme, useLayout());

export default useThemedStyles;
