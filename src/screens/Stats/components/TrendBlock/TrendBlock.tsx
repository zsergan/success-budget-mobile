import { StyleSheet, Text, View } from 'react-native';

import type { StatisticsTrend } from '@api/dto';
import { useTheme, useThemedStyles } from '@hooks';
import { formatMoney } from '@screens/Stats/format';
import type { StatsBlock } from '@screens/Stats/hooks/useStatsData';
import BlockError from '../BlockError/BlockError';
import BlockPlaceholder from '../BlockPlaceholder/BlockPlaceholder';
import TrendChart from '../TrendChart/TrendChart';
import { TREND_STEP, getTrendMax, toTrendGroups } from '../TrendChart/trendAdapter';

import createStyles from './style';

const Legend = ({ max }: { max: string }) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.legendRow}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.ok }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>

      {!!max && <Text style={styles.max}>{max}</Text>}
    </View>
  );
};

interface Props {
  block: StatsBlock<StatisticsTrend>;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onTouchInside?: () => void;
}

const TrendBlock = ({ block, selectedKey, onSelect, onTouchInside }: Props) => {
  const styles = useThemedStyles(createStyles);
  const trend = block.data;
  const groups = trend ? toTrendGroups(trend) : [];
  const max = getTrendMax(groups);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Trend</Text>
        {trend && <Text style={styles.step}>{TREND_STEP[trend.granularity]}</Text>}
      </View>

      {trend ? (
        <View style={styles.card}>
          <Legend max={max ? `max ${formatMoney(max.amount, trend.currency, { whole: true })}` : ''} />

          <TrendChart
            groups={groups}
            currency={trend.currency}
            selectedKey={selectedKey}
            onSelect={onSelect}
            onTouchInside={onTouchInside}
          />
        </View>
      ) : (
        <View>
          {/* The card's own layout, invisible, so the placeholder and the error take its height at any text size. */}
          <View
            style={[styles.card, styles.sample]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Legend max="max $0,000" />
            <View style={styles.chartArea} />
          </View>

          <View style={StyleSheet.absoluteFill}>
            {block.hasError ? (
              <BlockError title="Couldn’t load the trend" onRetry={block.retry} style={styles.fill} />
            ) : (
              <BlockPlaceholder style={styles.fill} />
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default TrendBlock;
