import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    // Fills the screen's height, so a short list leaves the room above the leave section.
    scrollContent: {
      flexGrow: 1,
      rowGap: scaleSpace(theme.spacing.xl, layout),
    },
    content: {
      flexGrow: 1,
      rowGap: scaleSpace(theme.spacing.xxl, layout),
      paddingBottom: scaleSpace(theme.spacing.xl, layout),
    },
    main: {
      flexGrow: 1,
      rowGap: scaleSpace(theme.spacing.xl, layout),
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: scaleSpace(theme.spacing.sm, layout),
      paddingVertical: scaleSpace(theme.spacing.xl, layout),
    },
    errorText: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
    },
  });

export default createStyles;
