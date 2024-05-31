import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import CircleIcon from '../../CircleIcon/CircleIcon';
import GradientBackground from '../../GradientBackground/GradientBackground';
import { palette } from '@shared/theme';
import { formatNumber } from '@shared/utils';
import { WalletDesign } from '@shared/enums';
import { gradients } from '@shared/constants';

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
  design = WalletDesign.GREEN,
  style,
}: WalletCardProps) => (
  <View style={[styles.root, style]}>
    <GradientBackground
      style={styles.gradient}
      colors={gradients[design]}
      start={{ x: 0.3, y: 0.0 }}
      end={{ x: 0.7, y: 1.0 }}
    />

    <View>
      <Text style={styles.name}>{`${walletName} Balance`}</Text>

      <Text style={styles.balance}>{`${formatNumber(Number(balance))} ${currencyCode}`}</Text>
    </View>

    <View style={styles.bottomInfo}>
      <View style={styles.totalBlock}>
        <CircleIcon icon="arrow-downward" size="lg" color={palette.green} />

        <View>
          <Text style={styles.name}>Income</Text>

          <Text style={styles.total}>{`${formatNumber(totalIncome || 0)} ${currencyCode}`}</Text>
        </View>
      </View>

      <View style={styles.totalBlock}>
        <CircleIcon icon="arrow-outward" size="lg" color={palette.red} />

        <View>
          <Text style={styles.name}>Expense</Text>

          <Text style={styles.total}>{`${formatNumber(totalSpend || 0)} ${currencyCode}`}</Text>
        </View>
      </View>
    </View>
  </View>
);

export default WalletCard;
