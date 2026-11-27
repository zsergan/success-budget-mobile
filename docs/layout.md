# Layout across phones and text sizes

The design is drawn for one phone at the default text size. The layout has to
hold on the phones people actually use and at the text size they set in iOS.

## What it is checked on

| Class     | Width     | Phones                          |
| --------- | --------- | ------------------------------- |
| `compact` | ≤ 389pt   | iPhone SE (375×667), 12/13 mini |
| `regular` | 390–427pt | base models and Pro (393–402)   |
| `large`   | ≥ 428pt   | Plus and Pro Max (428–440)      |

A phone at most 700pt tall (the SE, with a home button) is also `isShort`.
Text sizes: the default (Large), the largest standard size (XXXL) and an
accessibility size (AX3). Portrait only.

## The layout in a style factory

`useThemedStyles` passes the active `Layout` (`src/shared/layout.ts`) as the
factory's second argument; a factory that does not take it is still built
once per theme. Components outside a stylesheet read it with `useLayout()`.

```ts
const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    content: { paddingHorizontal: screenPadding(layout) },
    title: { fontFamily: theme.fonts.bold, ...textRole('titleLg', layout), color: colors.text },
    button: { ...fitHeight(52, theme.lineHeights.bodyLg), borderRadius: theme.radius.md },
  });
```

- **Insets, not sizes, follow the width.** `inset(value, layout)` keeps a
  design value on a `regular` phone, takes 20% off on a `compact` one and adds
  10% on a `large` one; `screenPadding(layout)` is the screen's side padding.
  Text, icons, radii and hit targets keep their design size on every phone.
- **Text follows the system size.** `allowFontScaling={false}` is only for a
  glyph inside a fixed-size graphic, such as an avatar's initial.
  Headings are capped through `textRole` (display and `titleLg` at 1.3×,
  `titleMd`/`titleSm` at 1.6×) so they leave room for the content; body text is
  not capped. A size drawn in a role's place (an amount, a line height of its
  own) uses `capRole(role, size, layout)`. Text that already sets
  `maxFontSizeMultiplier` (the Welcome headline, the logo, chart labels) is
  capped there; capping its style as well would shrink it below the cap.
- **A box around text never has a fixed `height`.** `fitHeight(height,
lineHeight, border)` gives the same box at the default size and lets it grow
  with its text. A box that centres its content, or a segmented switch with
  its own padding, takes `minHeight` instead. Fixed sizes stay on things
  without text: icons, avatars, swatches, progress tracks, skeletons.
- **Rows give way under large text.** When `layout.isLargeText` (above 1.15×)
  a row of label and value wraps or stacks, and a grid drops a column
  (`useCategoryColumns`). `isAccessibilityText` (above 1.6×) is for layouts
  that have to change shape altogether.
- **Everything scrolls.** A screen's content sits in a scroll view
  (`RootLayout`, `AuthFormLayout`) so it stays reachable on an SE at AX3.

## Tests

Pure helpers are tested in `src/shared/layout.test.ts`. To render a component
in a given layout, mock `@hooks/useLayout` with `getLayout({ width, height,
fontScale })`, as `src/hooks/useThemedStyles.test.tsx` does. Jest's default
window is 750pt wide, so an unmocked render is in the `large` class.
