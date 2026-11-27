import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    failure: {
      marginTop: -2,
      marginBottom: scaleSpace(22, layout),
    },
    note: {
      marginBottom: 2,
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(12.5, layout),
      lineHeight: scaleFont(18, layout),
      color: colors.muted,
    },
  });

export default createStyles;
