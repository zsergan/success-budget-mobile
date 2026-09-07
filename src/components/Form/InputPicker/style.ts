import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xs,
  },
  inputContainer: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: colors.surface,
  },
  input: {
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
  },
  placeholder: {
    color: colors.muted,
  },
  inputWithShadow: { ...shadow },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'flex-end',
    marginBottom: 28,
  },
  contentContainer: {
    backgroundColor: colors.bg,
    borderRadius: theme.radius.sm,
  },
});

export default styles;
