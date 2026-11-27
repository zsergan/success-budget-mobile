import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingBottom: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: screenPadding(layout),
      rowGap: scaleSpace(theme.spacing.md, layout),
      backgroundColor: colors.bg,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: FAB_SCROLL_CLEARANCE,
    },
    banner: {
      marginTop: scaleSpace(theme.spacing.md, layout),
    },
  });

export default createStyles;
