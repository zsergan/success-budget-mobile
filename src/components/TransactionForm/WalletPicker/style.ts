import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  section: {
    rowGap: theme.spacing.md - 2,
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  walletsRow: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  walletChip: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  walletDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  walletChipText: {
    flexShrink: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
});

export default styles;
