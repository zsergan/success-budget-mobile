import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

export const TOAST_MARK_SIZE = 22;
export const TOAST_GAP = theme.spacing.md;
export const TOAST_BORDER = 1;
export const TOAST_PADDING_START = 14;
export const TOAST_PADDING_PLAIN = 14;
export const TOAST_PADDING_AROUND_ACTIONS = theme.spacing.xs;
// Below this the message is too squeezed beside its controls, and they move under it.
export const TOAST_MESSAGE_MIN_WIDTH = 180;

const CONTROL_SIZE = 44;

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    frame: {
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
    },
    surface: {
      width: '100%',
      maxWidth: 560,
      minHeight: 52,
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: TOAST_BORDER,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      ...elevation.toast,
    },
    surfacePlain: {
      padding: TOAST_PADDING_PLAIN,
    },
    surfaceWithActions: {
      paddingVertical: TOAST_PADDING_AROUND_ACTIONS,
      paddingRight: TOAST_PADDING_AROUND_ACTIONS,
      paddingLeft: TOAST_PADDING_START,
    },
    surfaceStacked: {
      paddingTop: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: TOAST_GAP,
    },
    message: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    measure: {
      position: 'absolute',
      top: 0,
      left: 0,
      flex: 0,
      opacity: 0,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionsStacked: {
      alignSelf: 'flex-end',
      marginTop: TOAST_GAP,
    },
    divider: {
      width: 1,
      height: 28,
      backgroundColor: colors.line,
    },
    dividerHidden: {
      opacity: 0,
    },
    action: {
      minWidth: CONTROL_SIZE,
      minHeight: CONTROL_SIZE,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    actionLabel: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    close: {
      width: CONTROL_SIZE,
      height: CONTROL_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default createStyles;
