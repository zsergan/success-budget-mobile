import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: 7,
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  labelError: {
    color: colors.danger,
  },
  box: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  boxFocused: {
    borderColor: colors.text,
  },
  boxError: {
    borderColor: colors.danger,
  },
  boxDisabled: {
    backgroundColor: colors.track,
  },
  value: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    letterSpacing: -0.1,
    color: colors.text,
  },
  placeholder: {
    color: colors.placeholder,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 6,
    paddingLeft: 2,
  },
  errorIcon: {
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: 17,
    color: colors.danger,
  },
  hint: {
    paddingLeft: 2,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: 17,
    color: colors.muted,
  },
});

export default styles;
