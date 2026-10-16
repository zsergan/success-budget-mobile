import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.xs,
    },
    rootReverse: {
      flexDirection: 'column-reverse',
    },
    bar: {
      height: 6,
      width: '100%',
      borderRadius: 3,
      backgroundColor: colors.track,
    },
    progress: {
      height: 6,
      borderRadius: 3,
    },
    progressGreen: {
      backgroundColor: colors.ok,
    },
    progressYellow: {
      backgroundColor: colors.warn,
    },
    progressRed: {
      backgroundColor: colors.danger,
    },
    info: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoText: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
  });

export default createStyles;
