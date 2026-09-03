import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import CircleIcon from '../../CircleIcon/CircleIcon';
import WalletGradientBackground from '../WalletGradientBackground/WalletGradientBackground';
import { palette } from '@shared/theme';
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
  style?: StyleProp<ViewStyle>;
}

const WalletCard = ({
  walletName,
  balance,
  currencyCode,
  totalIncome,
  totalSpend,
  design = WalletDesign.SLATE,
  style,
}: WalletCardProps) => {
  const { fg, dim } = walletTextColors[resolveWalletDesign(design)];

  return (
    <View style={[styles.root, style]}>
      <WalletGradientBackground style={styles.gradient} design={design} />

      <View>
        <Text style={[styles.name, { color: dim }]}>{`${walletName} Balance`}</Text>

        <Text style={[styles.balance, { color: fg }]}>{`${formatNumber(Number(balance))} ${currencyCode}`}</Text>
      </View>

      <View style={styles.bottomInfo}>
        <View style={styles.totalBlock}>
          <CircleIcon icon="income" size="sm" color={palette.green} />

          <View>
            <Text style={[styles.name, { color: dim }]}>Income</Text>

            <Text style={[styles.total, { color: fg }]}>{`${formatNumber(totalIncome || 0)} ${currencyCode}`}</Text>
          </View>
        </View>

        <View style={styles.totalBlock}>
          <CircleIcon icon="expense" size="sm" color={palette.red} />

          <View>
            <Text style={[styles.name, { color: dim }]}>Expense</Text>

            <Text style={[styles.total, { color: fg }]}>{`${formatNumber(totalSpend || 0)} ${currencyCode}`}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default WalletCard;
