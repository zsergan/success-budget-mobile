import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const CARD_MIN_HEIGHT = 188;

const styles = StyleSheet.create({
  root: {
    marginTop: 22,
    rowGap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    letterSpacing: -0.2,
    color: colors.text,
  },
  step: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  card: {
    minHeight: CARD_MIN_HEIGHT,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    rowGap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  swatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  max: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 10,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  errorTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  retryButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  retryText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
});

export default styles;
