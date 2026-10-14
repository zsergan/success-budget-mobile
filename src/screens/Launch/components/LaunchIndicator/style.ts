import { StyleSheet } from 'react-native';

import { colors } from '@shared/theme';

export const TRACK_WIDTH = 112;
export const SEGMENT_WIDTH = TRACK_WIDTH * 0.32;

const HEIGHT = 3;

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  segment: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SEGMENT_WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT,
    backgroundColor: colors.accent,
  },
});

export default styles;
