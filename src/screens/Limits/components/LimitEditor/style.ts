import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      width: '100%',
    },
    topBlock: {
      paddingTop: theme.spacing.lg,
      rowGap: theme.spacing.md + 2,
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
      marginRight: theme.spacing.sm,
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
      marginTop: theme.spacing.md,
    },
    container: {
      marginHorizontal: theme.spacing.xl,
      rowGap: theme.spacing.xl,
    },
  });

export default createStyles;
