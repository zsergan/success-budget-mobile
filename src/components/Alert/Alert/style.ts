import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    backgroundColor: palette.white,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.radius.sm,
    backgroundColor: palette.red,
    opacity: 0.15,
  },
  container: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
    alignItems: 'center',
    maxWidth: '75%',
  },
  error: {
    borderColor: palette.red,
  },
  success: {},
  warning: {},
  info: {},
  text: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
});

export default styles;
