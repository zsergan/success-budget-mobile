import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      columnGap: scaleSpace(4, layout),
      padding: scaleSpace(4, layout),
      borderRadius: theme.radius.md,
      backgroundColor: colors.track,
    },
    segment: {
      flex: 1,
      minHeight: 38,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(5, layout),
    },
    segmentActive: {
      backgroundColor: colors.elevated,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
    labelActive: {
      color: colors.text,
    },
    count: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
  });

export default createStyles;
