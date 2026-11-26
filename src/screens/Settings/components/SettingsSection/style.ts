import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    section: {
      rowGap: scaleSpace(theme.spacing.sm, layout) - 2,
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      paddingLeft: scaleSpace(theme.spacing.xs, layout),
      color: colors.muted,
    },
    card: {
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    divider: {
      height: 1,
      backgroundColor: colors.hairline,
    },
  });

export default createStyles;
