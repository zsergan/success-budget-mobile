import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(theme.spacing.xs, layout),
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
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
  });

export default createStyles;
