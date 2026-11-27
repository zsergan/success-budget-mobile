import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme, layout: Layout) => {
  const card = {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  };

  return StyleSheet.create({
    root: {
      rowGap: scaleSpace(10, layout),
    },
    totalsRow: {
      flexDirection: 'row',
      columnGap: scaleSpace(10, layout),
    },
    totalCard: {
      ...card,
      flex: 1,
      minWidth: 0,
      paddingVertical: scaleSpace(11, layout),
      paddingHorizontal: scaleSpace(13, layout),
      rowGap: scaleSpace(3, layout),
    },
    totalLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(5, layout),
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    totalValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(17, layout),
      letterSpacing: -0.4,
      color: colors.text,
    },
    comparison: {
      minHeight: 28,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
    },
    netCard: {
      ...card,
      paddingVertical: scaleSpace(13, layout),
      paddingHorizontal: scaleSpace(14, layout),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    netText: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(3, layout),
    },
    netValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('titleLg', scaleFont(24, layout), layout),
      lineHeight: capRole('titleLg', scaleFont(28, layout), layout),
      letterSpacing: -0.7,
      color: colors.text,
    },
    netSurplus: {
      color: colors.ok,
    },
    netDeficit: {
      color: colors.danger,
    },
    chip: {
      minHeight: 28,
      paddingVertical: scaleSpace(4, layout),
      paddingHorizontal: scaleSpace(11, layout),
      borderRadius: 9,
      justifyContent: 'center',
    },
    chipSurplus: {
      backgroundColor: hexToRgba(colors.ok, 0.14),
    },
    chipDeficit: {
      backgroundColor: hexToRgba(colors.danger, 0.12),
    },
    chipBalanced: {
      backgroundColor: colors.track,
    },
    chipText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    chipTextSurplus: {
      color: colors.ok,
    },
    chipTextDeficit: {
      color: colors.danger,
    },
    sample: {
      opacity: 0,
    },
    fill: {
      flex: 1,
    },
  });
};

export default createStyles;
