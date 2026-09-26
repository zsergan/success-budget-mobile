import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import theme, { colorScheme } from '@shared/theme';

import styles from './style';

const FADE_HEIGHT = theme.spacing.lg;

const StatusBarBlur = () => {
  const { top } = useSafeAreaInsets();

  if (top === 0) {
    return null;
  }

  return (
    <MaskedView
      testID="status-bar-blur"
      style={[styles.root, { height: top }]}
      maskElement={
        <LinearGradient
          colors={['black', 'black', 'transparent']}
          locations={[0, Math.max(0, top - FADE_HEIGHT) / top, 1]}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <BlurView intensity={30} tint={colorScheme} style={StyleSheet.absoluteFill} />
    </MaskedView>
  );
};

export default StatusBarBlur;
