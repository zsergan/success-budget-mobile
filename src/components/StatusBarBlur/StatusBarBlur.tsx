import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useTheme from '@hooks/useTheme';
import theme from '@shared/theme';

import styles from './style';

const FADE_HEIGHT = theme.spacing.lg;

// The mask's alpha, not a drawn colour: opaque keeps the blur, transparent fades it out.
// eslint-disable-next-line no-restricted-syntax
const MASK_OPAQUE = 'black';

const StatusBarBlur = () => {
  const { top } = useSafeAreaInsets();
  const { scheme } = useTheme();

  if (top === 0) {
    return null;
  }

  return (
    <MaskedView
      testID="status-bar-blur"
      style={[styles.root, { height: top }]}
      maskElement={
        <LinearGradient
          colors={[MASK_OPAQUE, MASK_OPAQUE, 'transparent']}
          locations={[0, Math.max(0, top - FADE_HEIGHT) / top, 1]}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <BlurView intensity={30} tint={scheme} style={StyleSheet.absoluteFill} />
    </MaskedView>
  );
};

export default StatusBarBlur;
