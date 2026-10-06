import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  footer: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    rowGap: theme.spacing.sm,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
  },
  helperText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  saveButton: {
    height: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 9,
    backgroundColor: colors.track,
  },
  saveButtonReady: {
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
  },
  saveButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    letterSpacing: -0.1,
    color: colors.muted,
  },
});

export default styles;
