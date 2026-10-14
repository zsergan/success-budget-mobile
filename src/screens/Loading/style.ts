import { StyleSheet } from 'react-native';
import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xxl,
    backgroundColor: colors.bg,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  wordmarkContainer: {
    alignItems: 'center',
    rowGap: 7,
  },
  wordmark: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 27,
    letterSpacing: -0.8,
    color: colors.text,
  },
  subtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.label,
    color: colors.muted,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 96,
    left: theme.spacing.xxl,
    right: theme.spacing.xxl,
    alignItems: 'center',
    rowGap: theme.spacing.md + 2,
  },
  progressTrack: {
    width: 132,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  failureTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  status: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    textAlign: 'center',
    color: colors.muted,
  },
});

export default styles;
