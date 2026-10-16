import type { ColorSchemeName } from '@shared/theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

// The platform may report no appearance (null, undefined or 'unspecified'); that reads as light.
export const toColorScheme = (reported: unknown): ColorSchemeName => (reported === 'dark' ? 'dark' : 'light');

export const resolveColorScheme = (preference: ThemePreference, systemScheme: ColorSchemeName): ColorSchemeName =>
  preference === 'system' ? systemScheme : preference;
