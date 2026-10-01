import { StyleSheet, Text, View } from 'react-native';

import type { StatisticsSummary } from '@api/dto';
import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { ChangeTone, MoneySign } from '@screens/Stats/format';
import {
  formatChange,
  formatComparisonLabel,
  formatMoney,
  formatPeriodWord,
  getMoneySign,
} from '@screens/Stats/format';
import type { StatsBlock } from '@screens/Stats/hooks/useStatsData';
import BlockError from '../BlockError/BlockError';
import BlockPlaceholder from '../BlockPlaceholder/BlockPlaceholder';

import styles from './style';

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

interface CardsContent {
  income: { amount: string; comparison: string; tone: ChangeTone };
  expense: { amount: string; comparison: string; tone: ChangeTone };
  net: { label: string; amount: string; sign: MoneySign };
}

// Typical strings for the cards before there is data: laid out invisibly, they give the
// placeholder and the error the cards' own height at any text size.
const SAMPLE: CardsContent = {
  income: { amount: '$0,000.00', comparison: '+00% vs 1–28 Aug', tone: 'neutral' },
  expense: { amount: '$0,000.00', comparison: '+00% vs 1–28 Aug', tone: 'neutral' },
  net: { label: 'Net · September', amount: '+$0,000.00', sign: 1 },
};

const toTotal = (summary: StatisticsSummary, direction: 'income' | 'expense', showComparison: boolean) => {
  const change = showComparison && summary.change && summary.previous ? summary.change[direction] : null;
  const comparison = change && formatChange(change, direction);
  const label =
    comparison?.hasPercent && summary.previous ? ` ${formatComparisonLabel(summary.period, summary.previous)}` : '';

  return {
    amount: formatMoney(summary[direction].amount, summary.currency),
    comparison: comparison ? `${comparison.text}${label}` : '',
    tone: comparison?.tone ?? 'neutral',
  };
};

const toContent = (summary: StatisticsSummary, showComparison: boolean): CardsContent => ({
  income: toTotal(summary, 'income', showComparison),
  expense: toTotal(summary, 'expense', showComparison),
  net: {
    label: `Net · ${formatPeriodWord(summary.period)}`,
    amount: formatMoney(summary.net, summary.currency, { signed: true }),
    sign: getMoneySign(summary.net),
  },
});

interface TotalCardProps {
  direction: 'income' | 'expense';
  total: CardsContent['income'];
}

const TotalCard = ({ direction, total }: TotalCardProps) => (
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
      {total.amount}
    </Text>

    {/* Holds its two lines even when there is nothing to compare, so the cards keep their height. */}
    <Text style={[styles.comparison, { color: TONE_COLOR[total.tone] }]} numberOfLines={2}>
      {total.comparison}
    </Text>
  </View>
);

const Cards = ({ content }: { content: CardsContent }) => {
  const net = NET_STYLE[content.net.sign];

  return (
    <View style={styles.root}>
      <View style={styles.totalsRow}>
        <TotalCard direction="income" total={content.income} />
        <TotalCard direction="expense" total={content.expense} />
      </View>

      <View style={styles.netCard}>
        <View style={styles.netText}>
          <Text style={styles.label} numberOfLines={1}>
            {content.net.label}
          </Text>
          <Text style={[styles.netValue, net.value]} numberOfLines={1} adjustsFontSizeToFit>
            {content.net.amount}
          </Text>
        </View>

        <View style={[styles.chip, net.chip]}>
          <Text style={[styles.chipText, net.chipText]}>{net.word}</Text>
        </View>
      </View>
    </View>
  );
};

interface Props {
  block: StatsBlock<StatisticsSummary>;
  showComparison: boolean;
}

const SummaryCards = ({ block, showComparison }: Props) => {
  const summary = block.data;

  if (summary) return <Cards content={toContent(summary, showComparison)} />;

  return (
    <View>
      <View style={styles.sample} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Cards content={SAMPLE} />
      </View>

      <View style={StyleSheet.absoluteFill}>
        {block.hasError ? (
          <BlockError title="Couldn’t load the totals" onRetry={block.retry} style={styles.fill} />
        ) : (
          <BlockPlaceholder style={styles.fill} />
        )}
      </View>
    </View>
  );
};

export default SummaryCards;
