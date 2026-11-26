import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      width: '100%',
    },
    topBlock: {
      paddingTop: scaleSpace(theme.spacing.lg, layout),
      rowGap: scaleSpace(theme.spacing.md, layout) + 2,
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      alignSelf: 'center',
      backgroundColor: colors.track,
    },
    header: {
      paddingHorizontal: screenPadding(layout),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      flex: 1,
      marginRight: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    body: {
      flex: 1,
      marginTop: scaleSpace(theme.spacing.md, layout),
    },
    container: {
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      rowGap: scaleSpace(theme.spacing.xl, layout),
    },
  });

export default createStyles;
