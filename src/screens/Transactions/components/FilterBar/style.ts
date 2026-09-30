import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  totalCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    rowGap: 3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  totalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  totalLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  totalValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 17,
    letterSpacing: -0.4,
    color: colors.text,
  },
});

export default styles;
