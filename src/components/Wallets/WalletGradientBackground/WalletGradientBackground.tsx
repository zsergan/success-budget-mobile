import type { StyleProp, ViewStyle } from 'react-native';

import GradientBackground from '../../GradientBackground/GradientBackground';
import { gradients, resolveWalletDesign } from '@shared/constants';
import type { WalletDesign } from '@shared/enums';

interface Props {
  design: WalletDesign;
  style?: StyleProp<ViewStyle>;
}

// 152deg per Foundation.dc.html, converted from a CSS gradient-angle to
// expo-linear-gradient's normalized start/end points; `locations` matches
// the design's 0%/78% stops instead of an even 0%/100% spread.
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
