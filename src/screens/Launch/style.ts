import { Platform, StyleSheet } from 'react-native';

import { LAUNCH_LOCKUP_RAISE, STACKED_LOCKUP_HEIGHT, STACKED_MARK_HEIGHT } from '@components/Brand/launchLayout';
import theme, { colors } from '@shared/theme';

// iOS draws the whole lockup in its launch screen, raised above the centre; Android 12+ draws only the mark, at the
// window's centre, so there the mark stays put and the name and tagline appear under it.
const lockupTop = Platform.select({
  android: -STACKED_MARK_HEIGHT / 2,
  default: -LAUNCH_LOCKUP_RAISE - STACKED_LOCKUP_HEIGHT / 2,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  lockup: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: lockupTop,
  },
  progress: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 92,
    alignItems: 'center',
    rowGap: theme.spacing.md + 2,
    paddingHorizontal: 40,
  },
  status: {
    alignSelf: 'stretch',
    alignItems: 'center',
    rowGap: 5,
  },
  statusText: {
    alignSelf: 'stretch',
    fontFamily: theme.fonts.semiBold,
    fontSize: 12.5,
    textAlign: 'center',
    color: colors.muted,
  },
  statusSub: {
    alignSelf: 'stretch',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.muted,
  },
  failure: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    paddingHorizontal: 44,
  },
});

export default styles;
