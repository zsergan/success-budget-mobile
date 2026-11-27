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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
    },
    addButton: {
      minHeight: 30,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) - 2,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
      backgroundColor: colors.track,
    },
    addButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.text,
    },
    list: {
      rowGap: scaleSpace(theme.spacing.sm, layout) + 2,
    },
  });

export default createStyles;
