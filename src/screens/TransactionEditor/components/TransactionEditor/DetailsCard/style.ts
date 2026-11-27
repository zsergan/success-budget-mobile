import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { sectionLabel } from '../sectionStyle';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    section: {
      rowGap: scaleSpace(10, layout),
    },
    label: sectionLabel(colors),
    card: {
      borderRadius: scaleSpace(theme.spacing.lg, layout),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    cardError: {
      borderColor: colors.danger,
    },
    dateRow: {
      minHeight: 52,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(10, layout),
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    dateLabel: {
      rowGap: 1,
    },
    dateNote: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    rowLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    dateValue: {
      flex: 1,
      minWidth: 0,
      textAlign: 'right',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    descriptionRow: {
      minHeight: 52,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
      paddingVertical: scaleSpace(theme.spacing.md, layout) + 2,
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(10, layout),
    },
    descriptionIcon: {
      height: scaleFont(theme.lineHeights.label, layout),
      justifyContent: 'center',
    },
    description: {
      flex: 1,
      minWidth: 0,
      padding: 0,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
      textAlignVertical: 'top',
    },
    counter: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.muted,
    },
    counterError: {
      color: colors.danger,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
  });

export default createStyles;
