import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { sectionLabel } from '../sectionStyle';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: 10,
    },
    label: sectionLabel(colors),
    card: {
      borderRadius: theme.spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    cardError: {
      borderColor: colors.danger,
    },
    dateRow: {
      minHeight: 52,
      paddingHorizontal: theme.spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    rowLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    dateValue: {
      flex: 1,
      minWidth: 0,
      textAlign: 'right',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    descriptionRow: {
      minHeight: 52,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 10,
    },
    descriptionIcon: {
      height: theme.lineHeights.label,
      justifyContent: 'center',
    },
    description: {
      flex: 1,
      minWidth: 0,
      padding: 0,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
      textAlignVertical: 'top',
    },
    counter: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      lineHeight: theme.lineHeights.label,
      color: colors.muted,
    },
    counterError: {
      color: colors.danger,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.danger,
    },
  });

export default createStyles;
