import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: scaleSpace(theme.spacing.md, layout),
      backgroundColor: colors.bg,
    },
    banner: {
      marginTop: scaleSpace(theme.spacing.md, layout),
    },
  });

export default createStyles;
