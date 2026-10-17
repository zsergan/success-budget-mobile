import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: theme.spacing.md - 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      color: colors.text,
    },
    addButton: {
      height: 30,
      paddingHorizontal: theme.spacing.md - 2,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
      backgroundColor: colors.track,
    },
    addButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.text,
    },
    list: {
      rowGap: theme.spacing.sm + 2,
    },
  });

export default createStyles;
