import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import theme, { colorScheme } from '@shared/theme';

import styles from './style';

const FADE_HEIGHT = theme.spacing.xl;

const StatusBarBlur = () => {
  const { top } = useSafeAreaInsets();
  const height = top + FADE_HEIGHT;

  return (
    <MaskedView
      style={[styles.root, { height }]}
      maskElement={
        <LinearGradient
          colors={['black', 'black', 'transparent']}
          locations={[0, top / height, 1]}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <BlurView intensity={30} tint={colorScheme} style={StyleSheet.absoluteFill} />
    </MaskedView>
  );
};

export default StatusBarBlur;
