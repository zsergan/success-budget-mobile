import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'space-between',
    },
    sectionsContainer: {
      rowGap: theme.spacing.xl,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    spaceName: {
      width: '100%',
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.titleMd,
      lineHeight: theme.lineHeights.titleMd,
      letterSpacing: theme.letterSpacing.titleMd,
      color: colors.text,
    },
    actions: {
      rowGap: theme.spacing.md,
    },
  });

export default createStyles;
