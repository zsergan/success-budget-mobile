import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'flex-end',
    marginBottom: 34,
  },
  contentContainer: {
    backgroundColor: palette.white,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 0.5,
    backgroundColor: palette.grey,
  },
  action: {
    width: '100%',
  },
  cancel: {
    marginTop: theme.spacing.sm,
  },
});

export default styles;
