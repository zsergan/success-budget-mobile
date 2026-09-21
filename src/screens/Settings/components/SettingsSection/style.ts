import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  section: {
    rowGap: theme.spacing.sm - 2,
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    paddingLeft: theme.spacing.xs,
    color: colors.muted,
  },
  card: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
});

export default styles;
