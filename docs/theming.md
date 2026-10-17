# Theming

The app has a light and a dark theme. The preference (Light, Dark or System,
System by default) is local to the installation, outlives sessions and spaces,
and is stored under `THEME_PREFERENCE_KEY`. Startup and native surfaces:
`docs/launch.md`.

## Where colours live

- `src/shared/theme.ts` is the only palette. Both schemes implement one
  `ColorTheme`: semantic `colors`, `elevation` presets (card, modal, segment,
  fab, accentGlow), and the `wallets` and `categories` appearance of each
  `AppColor`. Add a token there when a role needs its own value in either
  scheme; never a literal in a screen.
- The default `theme` export (fonts, sizes, spacing, radii) is the same in
  both schemes and stays static.
- `ThemeProvider` resolves the preference and the device appearance into the
  active `ColorTheme`; `useTheme()` reads it.

## Writing a screen or component

- **Styles**: `style.ts` exports a factory of the theme, and the component
  reads it with `useThemedStyles`, which builds it once per theme.

  ```ts
  const createStyles = ({ colors, elevation }: ColorTheme) =>
    StyleSheet.create({ card: { backgroundColor: colors.surface, ...elevation.card } });
  export default createStyles;
  ```

  ```tsx
  const styles = useThemedStyles(createStyles);
  ```

- **Colours outside a stylesheet** (icon and SVG colours, spinners, gradients,
  placeholders, chart data) come from `useTheme().colorTheme` in the
  component. A colour map belongs inside the component or behind a function
  of the theme, never at module level, where it would keep the first theme.
- **Pure helpers** take the theme or its colours as an argument
  (`getBreakdownAppearance(group, colorTheme)`, `toBarData(…, colors)`); data
  transforms never call hooks.
- **Memoised values** that hold a colour list the theme among their
  dependencies.
- **Shared components** already follow the theme; prefer them to restyling
  native elements. Text inputs pass `keyboardAppearance={scheme}`.
- No light/dark branches: a role that differs between schemes is a token.
  The only `scheme` checks live in shared plumbing (navigation base theme,
  status bar, blur tint).

## Guardrails

`npm run lint` rejects, under `src/`, colour literals (hex, `rgb()`/`hsl()`,
`white`/`black`) and built colour strings, the removed fixed-theme exports,
reading `Appearance`/`useColorScheme` outside `ThemeProvider`, and
`=== 'dark'`/`'light'` comparisons in screens (`eslint.config.js`,
tested in `eslint.config.test.js`). `src/shared/theme.ts`, tests and the
asset scripts are exempt. A justified exception (a mask's luminance, alpha
added to a token) gets a one-line `eslint-disable-next-line` with its reason.

## Tests

Every test render gets the light theme from `jest.setup.js`. To check a theme
switch, render with `renderWithTheme` (`ThemeProvider/themeTestUtils.tsx`) and
call `setTheme('dark')`; assert that state and mounted children survive.
