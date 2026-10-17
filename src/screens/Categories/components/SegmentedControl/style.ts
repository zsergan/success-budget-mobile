import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      columnGap: 4,
      padding: 4,
      borderRadius: theme.radius.md,
      backgroundColor: colors.track,
    },
    segment: {
      flex: 1,
      height: 38,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 5,
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
      fontSize: theme.fontSizes.bodySm,
      color: colors.muted,
    },
    labelActive: {
      color: colors.text,
    },
    count: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.muted,
    },
  });

export default createStyles;
