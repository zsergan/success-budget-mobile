import { Text, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { Icon } from '@components';
import { colors } from '@shared/theme';
import { formatCurrencyAmount, getDaysLeftInMonth, getLimitStatus, hexToRgba } from '@shared/utils';

import styles from './style';

interface Props {
  limit: LimitModel;
  amount: string;
  currencyCode?: string;
}

const LimitHint = ({ limit, amount, currencyCode }: Props) => {
  const cap = Number(limit.amount);
  const typed = Number(amount.replace(',', '.')) || 0;
  const before = getLimitStatus(limit.spent, cap);
  const after = getLimitStatus(limit.spent + typed, cap);

  if (after.level === 'ok') {
    return null;
  }

  const isOver = after.level === 'over';
  const color = isOver ? colors.danger : colors.warn;
  const limitName = limit.name ?? limit.categories[0]?.name ?? 'limit';
  const spentAfter = limit.spent + typed;
  const daysLeft = getDaysLeftInMonth();

  const text = isOver
    ? `This goes ${formatCurrencyAmount(spentAfter - cap, currencyCode)} over the ${limitName} limit of ${formatCurrencyAmount(cap, currencyCode)}. It still saves; the limit just turns red.`
    : `This puts the ${limitName} limit at ${after.pctActual}% — ${formatCurrencyAmount(cap - spentAfter, currencyCode)} will be left of ${formatCurrencyAmount(cap, currencyCode)} for the rest of the month.`;

  return (
    <View style={[styles.root, { backgroundColor: hexToRgba(color, 0.1), borderColor: hexToRgba(color, 0.3) }]}>
      <Icon name={isOver ? 'alert' : 'info'} size={17} color={color} strokeWidth={1.9} />

      <View style={styles.content}>
        <Text style={styles.text}>{text}</Text>

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${before.pctClamped}%`, backgroundColor: color, opacity: 0.35 }]} />
          <View style={[styles.barFill, { width: `${after.pctClamped}%`, backgroundColor: color }]} />
        </View>

        <Text style={styles.footer}>
          {`${formatCurrencyAmount(limit.spent, currencyCode)} spent → ${formatCurrencyAmount(spentAfter, currencyCode)} · ${daysLeft} days left`}
        </Text>
      </View>
    </View>
  );
};

export default LimitHint;
