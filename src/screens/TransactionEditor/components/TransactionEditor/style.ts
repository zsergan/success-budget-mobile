import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      paddingBottom: scaleSpace(10, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
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
      paddingTop: scaleSpace(10, layout),
      paddingBottom: scaleSpace(28, layout),
      rowGap: scaleSpace(theme.spacing.xl, layout),
    },
    // The limit depends on the picked category, so its hint sits right under the grid.
    categoryBlock: {
      rowGap: scaleSpace(10, layout),
    },
    clearedNote: {
      borderRadius: 14,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      paddingVertical: scaleSpace(10, layout),
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.warnSoft,
    },
    clearedNoteText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.text,
    },
  });

export default createStyles;
