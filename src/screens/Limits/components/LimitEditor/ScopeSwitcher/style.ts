import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    scopeSwitch: {
      marginHorizontal: theme.spacing.xl,
      height: 46,
      borderRadius: 15,
      padding: 4,
      flexDirection: 'row',
      columnGap: 4,
      backgroundColor: colors.track,
    },
    scopeTab: {
      flex: 1,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scopeTabActive: {
      backgroundColor: colors.elevated,
      ...elevation.segment,
    },
    scopeTabText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
    scopeTabTextActive: {
      color: colors.text,
    },
  });

export default createStyles;
