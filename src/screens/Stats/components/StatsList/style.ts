import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const CARD_RADIUS = 18;

// The donut and the rows are separate list items drawn as one card: the donut
// item opens it, every row carries its side borders and the last row closes it.
const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  cardTop: {
    paddingTop: theme.spacing.lg,
    paddingBottom: 14,
    alignItems: 'center',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  cardMiddle: {
    paddingHorizontal: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  cardBottom: {
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
  },
  emptyCard: {
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    rowGap: 10,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  emptyTitle: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: colors.text,
  },
  emptyText: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: 17,
    color: colors.muted,
  },
});

export default styles;
