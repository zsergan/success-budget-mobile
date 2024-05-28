import { View, Text } from 'react-native';

import GradientBackground from '../../GradientBackground/GradientBackground';
import { gradients } from '@shared/constants';
import { WalletDesign } from '@shared/enums';

import styles from './style';

interface Props {
  walletName: string;
  currencyCode: string;
  design?: WalletDesign;
  backgroundStyle?: 'gradient' | 'border';
}

const TinyWallet = ({ walletName, currencyCode, design = WalletDesign.GREEN, backgroundStyle = 'gradient' }: Props) => (
  <View
    style={[
      styles.root,
      backgroundStyle === 'border' && styles.border,
      backgroundStyle === 'border' && { borderColor: gradients[design][1] },
    ]}
  >
    {backgroundStyle === 'gradient' && (
      <GradientBackground
        style={styles.gradient}
        colors={gradients[design]}
        start={{ x: 0.3, y: 0.0 }}
        end={{ x: 0.7, y: 1.0 }}
      />
    )}

    <Text style={styles.walletName} numberOfLines={1}>
      {walletName}
    </Text>

    <Text style={styles.currencyCode}>{`*** *** ${currencyCode}`}</Text>
  </View>
);

export default TinyWallet;
