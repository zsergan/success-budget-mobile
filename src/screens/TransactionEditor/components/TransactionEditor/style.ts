import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: theme.spacing.sm,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'transparent',
    },
    headerScrolled: {
      borderBottomColor: colors.hairline,
    },
    headerButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    headerButtonLocked: {
      opacity: 0.35,
    },
    headerTitle: {
      flex: 1,
      minWidth: 0,
      fontFamily: theme.fonts.bold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    fields: {
      flex: 1,
    },
    fieldsLocked: {
      opacity: 0.5,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: 10,
      paddingBottom: 28,
      rowGap: theme.spacing.xl,
    },
    // The limit depends on the picked category, so its hint sits right under the grid.
    categoryBlock: {
      rowGap: 10,
    },
    clearedNote: {
      borderRadius: 14,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: theme.spacing.sm,
      backgroundColor: colors.warnSoft,
    },
    clearedNoteText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: 17,
      color: colors.text,
    },
  });

export default createStyles;
