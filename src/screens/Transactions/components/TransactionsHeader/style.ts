import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, textRole } from '@shared/layout';
import theme from '@shared/theme';

// The search button is as tall as the field it grows into, so the header keeps one height in both modes.
export const BUTTON_SIZE = 40;
export const ICON_SIZE = 17;
export const FIELD_ICON_LEFT = 12;
export const CANCEL_GAP = 12;
// The field's children are placed inside its border, so the button's icon is centred against it.
export const FIELD_BORDER = 1.5;
const CLEAR_SIZE = 22;

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingVertical: scaleSpace(theme.spacing.md, layout),
    },
    // Grows with the title under large text; the field, laid over it, takes the row's height in both modes.
    row: {
      minHeight: BUTTON_SIZE,
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleLg', layout),
      letterSpacing: theme.letterSpacing.titleLg,
      color: colors.text,
    },
    field: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      borderRadius: 13,
      borderWidth: FIELD_BORDER,
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
      left: FIELD_ICON_LEFT + ICON_SIZE + scaleSpace(theme.spacing.sm, layout),
      right: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: scaleSpace(theme.spacing.sm, layout),
    },
    input: {
      flex: 1,
      height: '100%',
      padding: 0,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(15, layout),
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
      fontSize: scaleFont(15, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    error: {
      marginTop: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
  });

export default createStyles;
