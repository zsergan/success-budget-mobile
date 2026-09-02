import type { StyleProp, ViewStyle } from 'react-native';

import GradientBackground from '../../GradientBackground/GradientBackground';
import { gradients } from '@shared/constants';
import type { WalletDesign } from '@shared/enums';

interface Props {
  design: WalletDesign;
  style?: StyleProp<ViewStyle>;
}

const WalletGradientBackground = ({ design, style }: Props) => (
  <GradientBackground style={style} colors={gradients[design]} start={{ x: 0.3, y: 0.0 }} end={{ x: 0.7, y: 1.0 }} />
);

export default WalletGradientBackground;
