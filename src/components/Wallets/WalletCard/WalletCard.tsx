import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import WalletGradientBackground from '../WalletGradientBackground/WalletGradientBackground';
import { resolveAppColor, walletTextColors } from '@shared/constants';
import { formatCurrencyAmount } from '@shared/utils';
import { AppColor } from '@shared/enums';

import styles from './style';

export interface WalletCardProps {
  walletName: string;
  balance: string;
  currencyCode: string;
  totalIncome: number;
  totalSpend: number;
  design?: AppColor;
  onMorePress?: () => void;
  /** Small pill shown in place of the "more" button, e.g. "PREVIEW" on the create-wallet live preview. */
  badgeLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const WalletCard = ({
  walletName,
  balance,
  currencyCode,
  totalIncome,
  totalSpend,
  design = AppColor.SLATE,
  onMorePress,
  badgeLabel,
  style,
}: WalletCardProps) => {
  const { fg, dim, inner } = walletTextColors[resolveAppColor(design)];

  return (
    <View style={[styles.root, style]}>
      <WalletGradientBackground style={styles.gradient} design={design} />

      <View style={styles.topRow}>
        <View>
          <Text style={[styles.name, { color: dim }]}>{walletName}</Text>

          <Text style={[styles.balance, { color: fg }]}>
            {formatCurrencyAmount(Number(balance) || 0, currencyCode)}
          </Text>
        </View>

        {onMorePress && (
          <TouchableOpacity onPress={onMorePress} hitSlop={8}>
            <Icon name="more" size={18} color={dim} />
          </TouchableOpacity>
        )}

        {badgeLabel && (
          <View style={[styles.badge, { backgroundColor: inner }]}>
            <Text style={[styles.badgeText, { color: fg }]}>{badgeLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomInfo}>
        <View style={[styles.totalBlock, { backgroundColor: inner }]}>
          <Text style={[styles.name, { color: dim }]}>Income</Text>

          <Text style={[styles.total, { color: fg }]}>{formatCurrencyAmount(totalIncome || 0, currencyCode)}</Text>
        </View>

        <View style={[styles.totalBlock, { backgroundColor: inner }]}>
          <Text style={[styles.name, { color: dim }]}>Expense</Text>

          <Text style={[styles.total, { color: fg }]}>{formatCurrencyAmount(totalSpend || 0, currencyCode)}</Text>
        </View>
      </View>
    </View>
  );
};

export default WalletCard;
