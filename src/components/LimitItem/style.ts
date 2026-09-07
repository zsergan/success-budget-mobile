import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg - 4,
    padding: theme.spacing.md + 2,
    rowGap: theme.spacing.sm + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardOver: {
    borderColor: hexToRgba(colors.danger, 0.32),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm + 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 1,
    rowGap: 1,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    rowGap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.xs + 3,
  },
  name: {
    flexShrink: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    letterSpacing: -0.1,
    color: colors.text,
  },
  groupBadge: {
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  groupBadgeText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  sub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  amountBlock: {
    alignItems: 'flex-end',
    rowGap: 3,
  },
  spent: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    letterSpacing: -0.2,
    color: colors.text,
  },
  cap: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  statusText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
  },
  paceText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
});

export default styles;
