import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    marginTop: 2,
    rowGap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  labelError: {
    color: colors.danger,
  },
  paste: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  pasteUnderline: {
    paddingBottom: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent,
  },
  pasteText: {
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    paddingRight: 2,
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.text,
  },
  mutedText: {
    color: colors.muted,
  },
  cells: {
    flexDirection: 'row',
    columnGap: 8,
  },
  cell: {
    flex: 1,
    pointerEvents: 'none',
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    backgroundColor: colors.elevated,
  },
  cellDisabled: {
    backgroundColor: colors.track,
  },
  cellActive: {
    borderColor: colors.text,
    boxShadow: '0 0 0 4px rgba(255, 176, 32, 0.28)',
  },
  cellActiveError: {
    boxShadow: '0 0 0 4px rgba(224, 79, 61, 0.16)',
  },
  cellError: {
    borderColor: colors.danger,
  },
  digit: {
    fontFamily: theme.fonts.bold,
    fontSize: 25,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: 26,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  // Covers the boxes so a tap or long-press anywhere on them reaches the one real field.
  // iOS skips touches on a view under 0.01 opacity (0.01 itself rounds below as a float), so the field stays faintly opaque.
  field: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    backgroundColor: 'transparent',
    color: 'transparent',
    fontSize: 16,
  },
  message: {
    minHeight: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 6,
    paddingLeft: 2,
  },
  errorIcon: {
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
  },
  hintText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
});

export default styles;
