import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: screenPadding(layout),
      paddingBottom: scaleSpace(theme.spacing.sm, layout),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 2,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleMd', layout),
      letterSpacing: theme.letterSpacing.titleMd,
      color: colors.text,
    },
    sortChip: {
      minHeight: 32,
      paddingHorizontal: scaleSpace(theme.spacing.sm, layout) + 2,
      borderRadius: theme.radius.md - 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(5, layout),
      backgroundColor: colors.track,
    },
    sortChipActive: {
      backgroundColor: colors.accent,
    },
    sortChipText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.text,
    },
    sortChipTextActive: {
      color: colors.onAccent,
    },
    searchRow: {
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      marginBottom: scaleSpace(theme.spacing.sm, layout),
      minHeight: 44,
      borderRadius: theme.radius.md,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    searchRowActive: {
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
      padding: 0,
    },
    resultNote: {
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      marginBottom: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    segmentedWrap: {
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      marginBottom: scaleSpace(theme.spacing.md, layout),
    },
    body: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: scaleSpace(120, layout),
      rowGap: scaleSpace(theme.spacing.sm, layout) + 2,
    },
    archiveFootnoteRow: {
      marginTop: scaleSpace(theme.spacing.sm, layout),
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    archiveFootnoteText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    loadingContainer: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabRoot: {
      position: 'absolute',
      right: scaleSpace(theme.spacing.xl, layout),
      bottom: scaleSpace(theme.spacing.xxl, layout),
    },
    fab: {
      width: 58,
      height: 58,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      ...elevation.fab,
    },
  });

export default createStyles;
