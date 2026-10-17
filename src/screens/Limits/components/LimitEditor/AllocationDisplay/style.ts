import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: theme.spacing.md - 2,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      letterSpacing: 0.3,
      color: colors.muted,
    },
    sectionHint: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
    allocationBar: {
      height: 10,
      borderRadius: 6,
      overflow: 'hidden',
      flexDirection: 'row',
      columnGap: 2,
      backgroundColor: colors.track,
    },
    allocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
    },
    allocationDot: {
      width: 10,
      height: 10,
      borderRadius: 4,
    },
    allocationName: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    allocationAmount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    takenHint: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.micro,
      lineHeight: 16,
      color: colors.muted,
    },
  });

export default createStyles;
