import { View, Text } from 'react-native';

import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import WalletGradientBackground from '../WalletGradientBackground/WalletGradientBackground';
import { resolveAppColor } from '@shared/constants';
import { AppColor } from '@shared/enums';

import createStyles from './style';

interface Props {
  walletName: string;
  currencyCode: string;
  design?: AppColor;
  backgroundStyle?: 'gradient' | 'grey';
}

const TinyWallet = ({ walletName, currencyCode, design = AppColor.SLATE, backgroundStyle = 'gradient' }: Props) => {
  const { wallets } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const isGradient = backgroundStyle === 'gradient';
  const fg = isGradient ? wallets[resolveAppColor(design)].fg : undefined;

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
