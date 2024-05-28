import type { LinearGradientProps } from 'expo-linear-gradient';
import { LinearGradient } from 'expo-linear-gradient';

import styles from './style';

interface Props extends LinearGradientProps {}

const GradientBackground = ({ style, ...props }: Props) => (
  <LinearGradient style={[styles.background, style]} {...props} />
);

export default GradientBackground;
