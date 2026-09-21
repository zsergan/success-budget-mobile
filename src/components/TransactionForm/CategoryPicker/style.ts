import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
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
  categoryGrid: {
    marginHorizontal: -5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryCell: {
    width: '25%',
    paddingHorizontal: 5,
    marginBottom: 14,
    alignItems: 'center',
    rowGap: 6,
  },
  categoryIconBox: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  categoryName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.muted,
  },
});

export default styles;
