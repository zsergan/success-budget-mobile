import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      rowGap: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      backgroundColor: colors.bg,
    },
    message: {
      width: '100%',
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.muted,
      textAlign: 'center',
    },
    button: {
      width: '60%',
    },
  });

export default createStyles;
