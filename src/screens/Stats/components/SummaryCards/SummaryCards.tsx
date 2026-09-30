import { Text, TouchableOpacity, View } from 'react-native';

import type { StatisticsSummary } from '@api/dto';
import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { ChangeTone } from '@screens/Stats/format';
import {
  formatChange,
  formatComparisonLabel,
  formatMoney,
  formatPeriodWord,
  getMoneySign,
} from '@screens/Stats/format';
import type { StatsBlock } from '@screens/Stats/hooks/useStatsData';
import BlockPlaceholder from '../BlockPlaceholder/BlockPlaceholder';

import styles from './style';

const SUMMARY_PLACEHOLDER_HEIGHT = 170;

const TONE_COLOR: Record<ChangeTone, string> = {
  good: colors.ok,
  bad: colors.danger,
  neutral: colors.muted,
};

const NET_STYLE = {
  [1]: { word: 'Surplus', value: styles.netSurplus, chip: styles.chipSurplus, chipText: styles.chipTextSurplus },
  [-1]: { word: 'Deficit', value: styles.netDeficit, chip: styles.chipDeficit, chipText: styles.chipTextDeficit },
  [0]: { word: 'Balanced', value: undefined, chip: styles.chipBalanced, chipText: undefined },
};

interface TotalCardProps {
  direction: 'income' | 'expense';
  summary: StatisticsSummary;
  showComparison: boolean;
}

const TotalCard = ({ direction, summary, showComparison }: TotalCardProps) => {
  const change = showComparison && summary.change && summary.previous ? summary.change[direction] : null;
  const comparison = change && formatChange(change, direction);
  const label =
    comparison?.hasPercent && summary.previous ? ` ${formatComparisonLabel(summary.period, summary.previous)}` : '';

  return (
    <View style={styles.totalCard}>
      <View style={styles.totalLabelRow}>
        {direction === 'income' ? (
          <Icon name="income" size={11} color={colors.ok} strokeWidth={2.4} />
        ) : (
          <Icon name="expense" size={11} color={colors.danger} strokeWidth={2.4} />
        )}
        <Text style={styles.label}>{direction === 'income' ? 'Income' : 'Expense'}</Text>
      </View>

      <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(summary[direction].amount, summary.currency)}
      </Text>

      {/* Holds its two lines even when there is nothing to compare, so the cards keep their height. */}
      <Text
        style={[styles.comparison, { color: comparison ? TONE_COLOR[comparison.tone] : colors.muted }]}
        numberOfLines={2}
      >
        {comparison ? `${comparison.text}${label}` : ''}
      </Text>
    </View>
  );
};

interface Props {
  block: StatsBlock<StatisticsSummary>;
  showComparison: boolean;
}

const SummaryCards = ({ block, showComparison }: Props) => {
  const summary = block.data;

  if (!summary) {
    return block.hasError ? (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>Couldn’t load the totals</Text>

        <TouchableOpacity style={styles.retryButton} onPress={block.retry} activeOpacity={0.7}>
          <Icon name="refresh" size={13} color={colors.text} strokeWidth={2.2} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <BlockPlaceholder height={SUMMARY_PLACEHOLDER_HEIGHT} />
    );
  }

  const net = NET_STYLE[getMoneySign(summary.net)];

  return (
    <View style={styles.root}>
      <View style={styles.totalsRow}>
        <TotalCard direction="income" summary={summary} showComparison={showComparison} />
        <TotalCard direction="expense" summary={summary} showComparison={showComparison} />
      </View>

      <View style={styles.netCard}>
        <View style={styles.netText}>
          <Text style={styles.label} numberOfLines={1}>
            {`Net · ${formatPeriodWord(summary.period)}`}
          </Text>
          <Text style={[styles.netValue, net.value]} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(summary.net, summary.currency, { signed: true })}
          </Text>
        </View>

        <View style={[styles.chip, net.chip]}>
          <Text style={[styles.chipText, net.chipText]}>{net.word}</Text>
        </View>
      </View>
    </View>
  );
};

export default SummaryCards;
