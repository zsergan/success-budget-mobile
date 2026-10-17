import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    // The height comes from useBoundedHeight; a flex here would let the measured sheet collapse it.
    root: {
      width: '100%',
    },
    topBlock: {
      paddingTop: theme.spacing.sm,
      rowGap: theme.spacing.md + 2,
    },
    topFields: {
      marginTop: theme.spacing.md + 2,
      rowGap: theme.spacing.md + 2,
    },
    fields: {
      flex: 1,
    },
    fieldsLocked: {
      opacity: 0.55,
    },
    limitHint: {
      marginHorizontal: theme.spacing.xl,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
    },
    headerTitle: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleSm,
      lineHeight: theme.lineHeights.titleSm,
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    headerButton: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    // Without an explicit flex the ScrollView sizes to content instead of the sheet's remaining height, breaking the keyboard inset.
    body: {
      flex: 1,
    },
    container: {
      marginHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      rowGap: theme.spacing.xl,
    },
    section: {
      rowGap: theme.spacing.md - 2,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      letterSpacing: 0.3,
      color: colors.muted,
    },
    sectionHint: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    sectionHintError: {
      color: colors.danger,
    },
    note: {
      minHeight: 64,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md + 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      textAlignVertical: 'top',
    },
  });

export default createStyles;
