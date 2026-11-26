import { Platform, StyleSheet } from 'react-native';

import { LAUNCH_LOCKUP_RAISE, STACKED_LOCKUP_HEIGHT, STACKED_MARK_HEIGHT } from '@components/Brand/launchLayout';
import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

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

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
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
      marginTop: lockupTop + STACKED_LOCKUP_HEIGHT + scaleSpace(theme.spacing.xxl, layout),
    },
    belowContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: scaleSpace(44, layout),
    },
    progress: {
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.md, layout) + 2,
      // Wider than the design's 40 a side: RN measures the long-wait note a touch wider than the browser does, and the
      // note is designed to fit on one line.
      marginHorizontal: -scaleSpace(theme.spacing.md, layout),
    },
    status: {
      alignSelf: 'stretch',
      alignItems: 'center',
      rowGap: scaleSpace(5, layout),
    },
    statusText: {
      alignSelf: 'stretch',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(12.5, layout),
      textAlign: 'center',
      color: colors.muted,
    },
    statusSub: {
      alignSelf: 'stretch',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      textAlign: 'center',
      color: colors.muted,
    },
  });

export default createStyles;
