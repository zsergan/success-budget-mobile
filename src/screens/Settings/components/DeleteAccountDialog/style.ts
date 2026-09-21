import { StyleSheet } from 'react-native';

import theme, { colors, shadowModal } from '@shared/theme';

const styles = StyleSheet.create({
  card: {
    width: '86%',
    maxWidth: 380,
    borderRadius: theme.radius.lg + 6,
    padding: theme.spacing.xl + 2,
    rowGap: theme.spacing.lg,
    backgroundColor: colors.elevated,
    ...shadowModal,
  },
  step: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
});

export default styles;
