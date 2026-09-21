import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  dateTimeRow: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
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
  dateBox: {
    flex: 1,
  },
  timeBox: {
    width: 118,
  },
  pickerBox: {
    height: 50,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md + 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pickerText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
});

export default styles;
