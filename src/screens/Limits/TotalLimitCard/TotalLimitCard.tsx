import { Text, TouchableOpacity, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { Icon, WalletGradientBackground } from '@components';
import { walletTextColors } from '@shared/constants';
import { WalletDesign } from '@shared/enums';
import { colors } from '@shared/theme';
import { formatCurrencyAmount, getDailyPace, getDaysLeftInMonth, getLimitStatus } from '@shared/utils';

import styles from './style';

interface Props {
  total: LimitModel;
  currencyCode?: string;
  onEdit: () => void;
}

const nextResetLabel = () => {
  const now = new Date();
  const resetsOn = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return resetsOn.toLocaleString('en-US', { day: 'numeric', month: 'short' });
};

const TotalLimitCard = ({ total, currencyCode, onEdit }: Props) => {
  const { fg, dim, inner } = walletTextColors[WalletDesign.SLATE];
  const amount = Number(total.amount);
  const status = getLimitStatus(total.spent, amount);
  const daysLeft = getDaysLeftInMonth();
  const pace = getDailyPace(total.spent, amount, daysLeft);
  const barColor = status.level === 'over' ? colors.danger : status.level === 'near' ? colors.warn : colors.accent;

  return (
    <View style={styles.root}>
      <WalletGradientBackground style={styles.gradient} design={WalletDesign.SLATE} />

      <View style={styles.topRow}>
        <View>
          <Text style={[styles.label, { color: dim }]}>All expenses this month</Text>

          <View style={styles.amountRow}>
            <Text style={[styles.spent, { color: fg }]}>{formatCurrencyAmount(total.spent, currencyCode)}</Text>

            <Text style={[styles.cap, { color: dim }]}>{`of ${formatCurrencyAmount(amount, currencyCode)}`}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.editButton, { backgroundColor: inner }]} onPress={onEdit} hitSlop={8}>
          <Icon name="edit" size={15} color={fg} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: inner }]}>
        <View style={[styles.progressFill, { width: `${status.pctClamped}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.statsRow}>
        <Text style={[styles.statText, { color: fg }]}>
          {status.level === 'over'
            ? `Over by ${formatCurrencyAmount(total.spent - amount, currencyCode)}`
            : `${formatCurrencyAmount(amount - total.spent, currencyCode)} left`}
        </Text>

        <Text style={[styles.statText, { color: dim }]}>
          {status.level === 'over'
            ? `Day ${new Date().getDate()} of the month`
            : `${formatCurrencyAmount(pace, currencyCode)}/day to stay inside`}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: inner }]} />

      <View style={styles.resetRow}>
        <Icon name="refresh" size={13} color={dim} strokeWidth={1.8} />

        <Text
          style={[styles.resetText, { color: dim }]}
        >{`Resets to $0.00 on ${nextResetLabel()} · nothing carries over`}</Text>
      </View>
    </View>
  );
};

export default TotalLimitCard;
