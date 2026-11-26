import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
      padding: scaleSpace(theme.spacing.md, layout) + 2,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(3, layout),
    },
    rowLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
    },
    rowLabelDanger: {
      color: colors.danger,
    },
    rowSub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    rowValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.muted,
    },
    toggleTrack: {
      width: 48,
      height: 29,
      borderRadius: 15,
      padding: scaleSpace(3, layout),
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
