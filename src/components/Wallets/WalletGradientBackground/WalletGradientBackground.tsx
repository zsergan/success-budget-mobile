import type { StyleProp, ViewStyle } from 'react-native';

import { GradientBackground } from '@components';
import { gradients, resolveWalletDesign } from '@shared/constants';
import type { WalletDesign } from '@shared/enums';

interface Props {
  design: WalletDesign;
  style?: StyleProp<ViewStyle>;
}

// 152deg converted to expo-linear-gradient's start/end points; locations match the design's 0%/78% stops.
const WalletGradientBackground = ({ design, style }: Props) => (
  <GradientBackground
    style={style}
    colors={gradients[resolveWalletDesign(design)]}
    locations={[0, 0.78]}
    start={{ x: 0.27, y: 0.06 }}
    end={{ x: 0.73, y: 0.94 }}
  />
);

export default WalletGradientBackground;
