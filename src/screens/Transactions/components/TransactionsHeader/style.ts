import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

// The search button is as tall as the field it grows into, so the header keeps one height in both modes.
export const BUTTON_SIZE = 40;
export const ICON_SIZE = 17;
export const FIELD_ICON_LEFT = 12;
export const CANCEL_GAP = 12;
const CLEAR_SIZE = 22;

const styles = StyleSheet.create({
  header: {
    paddingVertical: theme.spacing.md,
  },
  row: {
    height: BUTTON_SIZE,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    lineHeight: theme.lineHeights.titleLg,
    letterSpacing: theme.letterSpacing.titleLg,
    color: colors.text,
  },
  field: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 13,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  unmeasured: {
    opacity: 0,
  },
  fieldPress: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  icon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ICON_SIZE,
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
  },
  inputBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: FIELD_ICON_LEFT + ICON_SIZE + theme.spacing.sm,
    right: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: colors.text,
  },
  inputEmpty: {
    fontFamily: theme.fonts.medium,
  },
  clear: {
    width: CLEAR_SIZE,
    height: CLEAR_SIZE,
    borderRadius: CLEAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  cancel: {
    position: 'absolute',
    right: 0,
  },
  cancelText: {
    // Plus Jakarta SemiBold under-measures a hugging label and clips its last glyph (see cde3346).
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
  },
  error: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.danger,
  },
});

export default styles;
