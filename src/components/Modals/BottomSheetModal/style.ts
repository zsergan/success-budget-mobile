import { StyleSheet } from 'react-native';
import type { ColorTheme } from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    contentContainer: {
      flex: 1,
      alignItems: 'center',
    },
    background: {
      borderRadius: 28,
      backgroundColor: colors.elevated,
    },
    handle: {
      height: 24,
      paddingVertical: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handleIndicator: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.track,
    },
    // The sheet waits on its action and cannot be swiped away.
    handleIndicatorLocked: {
      opacity: 0.4,
    },
  });

export default createStyles;
