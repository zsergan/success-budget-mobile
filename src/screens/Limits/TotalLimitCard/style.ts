import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    borderRadius: theme.radius.lg + 2,
    padding: theme.spacing.xl,
    rowGap: theme.spacing.md - 1,
    ...shadow,
  },
  gradient: {
    borderRadius: theme.radius.lg + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.2,
  },
  amountRow: {
    marginTop: theme.spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: 7,
  },
  spent: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 34,
    letterSpacing: -1.4,
  },
  cap: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
  },
  divider: {
    height: 1,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm - 1,
  },
  resetText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.micro,
  },
});

export default styles;
