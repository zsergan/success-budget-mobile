import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '../../Icon/Icon';
import WalletGradientBackground from '../WalletGradientBackground/WalletGradientBackground';
import { resolveWalletDesign, walletTextColors } from '@shared/constants';
import { formatNumber } from '@shared/utils';
import { WalletDesign } from '@shared/enums';

import styles from './style';

export interface WalletCardProps {
  walletName: string;
  balance: string;
  currencyCode: string;
  totalIncome: number;
  totalSpend: number;
  design?: WalletDesign;
  onMorePress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const WalletCard = ({
  walletName,
  balance,
  currencyCode,
  totalIncome,
  totalSpend,
  design = WalletDesign.SLATE,
  onMorePress,
  style,
}: WalletCardProps) => {
  const { fg, dim, inner } = walletTextColors[resolveWalletDesign(design)];

  return (
    <View style={[styles.root, style]}>
      <WalletGradientBackground style={styles.gradient} design={design} />

      <View style={styles.topRow}>
        <View>
          <Text style={[styles.name, { color: dim }]}>{walletName}</Text>

          <Text style={[styles.balance, { color: fg }]}>{`${formatNumber(Number(balance))} ${currencyCode}`}</Text>
        </View>

        {onMorePress && (
          <TouchableOpacity onPress={onMorePress} hitSlop={8}>
            <Icon name="more" size={18} color={dim} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomInfo}>
        <View style={[styles.totalBlock, { backgroundColor: inner }]}>
          <Text style={[styles.name, { color: dim }]}>Income</Text>

          <Text style={[styles.total, { color: fg }]}>{`${formatNumber(totalIncome || 0)} ${currencyCode}`}</Text>
        </View>

        <View style={[styles.totalBlock, { backgroundColor: inner }]}>
          <Text style={[styles.name, { color: dim }]}>Expense</Text>

          <Text style={[styles.total, { color: fg }]}>{`${formatNumber(totalSpend || 0)} ${currencyCode}`}</Text>
        </View>
      </View>
    </View>
  );
};

export default WalletCard;
