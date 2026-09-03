import { View, Text } from 'react-native';

import WalletGradientBackground from '../WalletGradientBackground/WalletGradientBackground';
import { resolveWalletDesign, walletTextColors } from '@shared/constants';
import { WalletDesign } from '@shared/enums';

import styles from './style';

interface Props {
  walletName: string;
  currencyCode: string;
  design?: WalletDesign;
  backgroundStyle?: 'gradient' | 'grey';
}

const TinyWallet = ({ walletName, currencyCode, design = WalletDesign.SLATE, backgroundStyle = 'gradient' }: Props) => {
  const isGradient = backgroundStyle === 'gradient';
  const fg = isGradient ? walletTextColors[resolveWalletDesign(design)].fg : undefined;

  return (
    <View style={[styles.root, backgroundStyle === 'grey' && styles.grey]}>
      {isGradient && <WalletGradientBackground style={styles.gradient} design={design} />}

      <Text style={[styles.walletName, fg && { color: fg }]} numberOfLines={1}>
        {walletName}
      </Text>

      <Text style={[styles.currencyCode, fg && { color: fg }]}>{`*** *** ${currencyCode}`}</Text>
    </View>
  );
};

export default TinyWallet;
