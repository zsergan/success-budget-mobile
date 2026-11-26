import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    typeSwitch: {
      minHeight: 44,
      borderRadius: 15,
      padding: scaleSpace(4, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(4, layout),
      backgroundColor: colors.track,
    },
    typeTab: {
      flex: 1,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(7, layout),
    },
    typeTabActive: {
      backgroundColor: colors.elevated,
      ...elevation.segment,
    },
    typeTabText: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
    },
  });

export default createStyles;
