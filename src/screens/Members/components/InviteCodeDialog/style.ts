import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    codeContainer: {
      alignItems: 'center',
      paddingVertical: scaleSpace(theme.spacing.lg, layout),
      paddingHorizontal: scaleSpace(14, layout),
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    code: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleLg', layout),
      letterSpacing: 4,
      color: colors.accent,
    },
  });

export default createStyles;
