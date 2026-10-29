import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

export const TOAST_EDGE_GAP = theme.spacing.md;
export const TOAST_TOP_GAP = theme.spacing.sm;
// From the bottom of a screen with no bottom safe area.
export const TOAST_BARE_BOTTOM = theme.spacing.lg;

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
  },
  position: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    maxWidth: 560,
  },
});

export default styles;
