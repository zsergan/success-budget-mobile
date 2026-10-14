import { Platform, StyleSheet } from 'react-native';

import { LAUNCH_LOCKUP_RAISE, STACKED_LOCKUP_HEIGHT, STACKED_MARK_HEIGHT } from '@components/Brand/launchLayout';
import theme, { colors } from '@shared/theme';

// From the bottom of the screen, as in the design; never less than the home indicator's area.
export const PROGRESS_BOTTOM = 92;
export const FAILURE_BOTTOM = 80;

// Text under the logo grows with the system size up to this: past it, even the tallest phones lose the room.
export const TEXT_SCALE_LIMIT = 1.6;

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
  below: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    marginTop: lockupTop + STACKED_LOCKUP_HEIGHT + theme.spacing.xxl,
  },
  belowContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 44,
  },
  progress: {
    alignItems: 'center',
    rowGap: theme.spacing.md + 2,
    // 40 in the design, against the failure's 44.
    marginHorizontal: -4,
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
});

export default styles;
