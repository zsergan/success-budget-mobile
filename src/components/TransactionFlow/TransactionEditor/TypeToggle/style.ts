import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    typeSwitch: {
      marginHorizontal: theme.spacing.xl,
      height: 46,
      borderRadius: 15,
      padding: 4,
      flexDirection: 'row',
      columnGap: 4,
      backgroundColor: colors.track,
    },
    typeTab: {
      flex: 1,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 7,
    },
    typeTabActive: {
      backgroundColor: colors.elevated,
      ...elevation.segment,
    },
    typeTabText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
    },
  });

export default createStyles;
