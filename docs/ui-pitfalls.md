# UI pitfalls

Layout bugs that have come back more than once in this app, with the fix
used in the code.

## Plus Jakarta Sans clips its last glyph

Plus Jakarta Sans (SemiBold and Bold especially) under-measures its own
width by a couple of points, so the last glyph of a `Text` gets clipped.
The bug is in the font itself, not in one screen; first fixed in
`cde3346`. Expect it in any new label set in this font.

The fix depends on how the box is sized:

- **Stretched by its parent** (e.g. a `flex: 1` row): give the `Text`
  itself `flex: 1`, or `width: '100%'` against a parent with a fixed
  width. A shrink-wrapping parent needs `alignSelf: 'stretch'` first.
- **Hugs its content** (chip, pill, button label): add `paddingRight: 2`
  to the `Text` style, with the one-line comment used elsewhere:
  `// Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).`

A related symptom: Medium in a `TextInput` can collapse the space between
words; `src/components/Form/Input/style.ts` fixes it with `letterSpacing`.

**Checking a fix.** A downscaled full-screen screenshot is not enough.
It has missed real clipping and has also made the normal notch of a
letter `e`, or anti-aliasing on a rounded corner, look clipped. Crop
tightly to the text and view it at native resolution. For a precise
check, measure pixels, using a known layout size in the same screenshot
(such as a button's fixed height) to convert pixels to points.

## Nested safe areas double the bottom inset

`SafeAreaProvider` (in `App.tsx`) measures the device safe area once and
passes that value to every `SafeAreaView` and `useSafeAreaInsets()`.
A `SafeAreaView` does not measure where it sits on screen: one inside a
bottom-tab screen still adds the bottom inset, which the tab bar has
already reserved. The content area shrinks and scroll content is cut off
above the tab bar. This was confirmed in the library's native iOS source
(`RNCSafeAreaShadowView.m`).

The fix: `ScreenFrame` (`src/components/ScreenFrame/`) and `RootLayout`
take an `edges` prop that defaults to all four edges. Every screen in a
`MainNavigator` tab passes `edges={['top', 'left', 'right']}`. Screens
with no tab bar below them keep the default. A new tab screen, or a
screen rendered inside a tab, needs the same exclusion.
