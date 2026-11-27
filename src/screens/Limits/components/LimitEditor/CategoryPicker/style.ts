import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    section: {
      rowGap: scaleSpace(theme.spacing.md, layout) - 2,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      letterSpacing: 0.3,
      color: colors.muted,
    },
    sectionHint: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    categoryGrid: {
      marginHorizontal: -scaleSpace(5, layout),
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    categoryCell: {
      width: '25%',
      paddingHorizontal: scaleSpace(5, layout),
      marginBottom: scaleSpace(14, layout),
      alignItems: 'center',
      rowGap: scaleSpace(6, layout),
    },
    categoryIconBox: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.hairline,
    },
    categoryName: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(10, layout),
      lineHeight: scaleFont(13, layout),
      textAlign: 'center',
      color: colors.muted,
    },
    categoryNameSelected: {
      color: colors.text,
    },
    categoryNameTaken: {
      color: colors.muted,
      opacity: 0.6,
    },
    selectedBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.elevated,
    },
    takenBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
      borderWidth: 2,
      borderColor: colors.elevated,
    },
    takenHint: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(16, layout),
      color: colors.muted,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
  });

export default createStyles;
