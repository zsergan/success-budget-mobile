import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    scopeSwitch: {
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      minHeight: 46,
      borderRadius: 15,
      padding: scaleSpace(4, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(4, layout),
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
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    scopeTabTextActive: {
      color: colors.text,
    },
  });

export default createStyles;
