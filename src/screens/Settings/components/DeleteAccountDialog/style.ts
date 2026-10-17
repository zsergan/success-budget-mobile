import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    card: {
      width: '86%',
      maxWidth: 380,
      borderRadius: theme.radius.lg + 6,
      padding: theme.spacing.xl + 2,
      rowGap: theme.spacing.lg,
      backgroundColor: colors.elevated,
      ...elevation.modal,
    },
    step: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.muted,
    },
  });

export default createStyles;
