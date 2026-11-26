import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: screenPadding(layout),
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
