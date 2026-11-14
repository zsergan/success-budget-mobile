import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'transparent',
    },
    headerScrolled: {
      borderBottomColor: colors.hairline,
    },
    headerButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    headerButtonLocked: {
      opacity: 0.35,
    },
    headerTitle: {
      flex: 1,
      minWidth: 0,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.titleSm,
      lineHeight: theme.lineHeights.titleSm,
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    fields: {
      flex: 1,
    },
    fieldsLocked: {
      opacity: 0.5,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: 10,
      paddingBottom: 28,
      rowGap: theme.spacing.xl,
    },
    // The limit depends on the picked category, so its hint sits right under the grid.
    categoryBlock: {
      rowGap: 10,
    },
  });

export default createStyles;
