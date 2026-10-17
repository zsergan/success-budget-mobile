import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ elevation }: ColorTheme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.xl,
      alignSelf: 'flex-end',
      ...elevation.card,
    },
    options: {
      alignSelf: 'flex-end',
    },
  });

export default createStyles;
