import { View, Text } from 'react-native';

import WalletGradientBackground from '../WalletGradientBackground/WalletGradientBackground';
import { WalletDesign } from '@shared/enums';

import styles from './style';

interface Props {
  walletName: string;
  currencyCode: string;
  design?: WalletDesign;
  backgroundStyle?: 'gradient' | 'grey';
}

const TinyWallet = ({ walletName, currencyCode, design = WalletDesign.GREEN, backgroundStyle = 'gradient' }: Props) => (
  <View style={[styles.root, backgroundStyle === 'grey' && styles.grey]}>
    {backgroundStyle === 'gradient' && <WalletGradientBackground style={styles.gradient} design={design} />}

    <Text style={styles.walletName} numberOfLines={1}>
      {walletName}
    </Text>

    <Text style={styles.currencyCode}>{`*** *** ${currencyCode}`}</Text>
  </View>
);

export default TinyWallet;
