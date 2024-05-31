import { StyleSheet } from 'react-native';

import theme, { palette, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xs,
  },
  inputContainer: {
    paddingVertical: theme.spacing.sm + 1,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.sm,
    backgroundColor: palette.white,
    minHeight: 46,
  },
  input: {
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.md,
  },
  placeholder: {
    color: theme.colors.text.secondary,
  },
  inputWithShadow: { ...shadow },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'flex-end',
    marginBottom: 28,
  },
  contentContainer: {
    backgroundColor: palette.greyLight,
    borderRadius: theme.radius.sm,
  },
});

export default styles;
