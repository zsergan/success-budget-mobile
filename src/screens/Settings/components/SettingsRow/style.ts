import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      padding: theme.spacing.md + 2,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      rowGap: 3,
    },
    rowLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      color: colors.text,
    },
    rowLabelDanger: {
      color: colors.danger,
    },
    rowSub: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    rowValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      color: colors.muted,
    },
    toggleTrack: {
      width: 48,
      height: 29,
      borderRadius: 15,
      padding: 3,
      backgroundColor: colors.track,
    },
    toggleKnob: {
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor: colors.elevated,
    },
  });

export default createStyles;
