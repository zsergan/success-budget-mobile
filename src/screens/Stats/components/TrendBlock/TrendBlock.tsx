import { Text, TouchableOpacity, View } from 'react-native';

import type { StatisticsTrend } from '@api/dto';
import { Icon } from '@components';
import { colors } from '@shared/theme';
import { formatMoney } from '@screens/Stats/format';
import type { StatsBlock } from '@screens/Stats/hooks/useStatsData';
import BlockPlaceholder from '../BlockPlaceholder/BlockPlaceholder';
import TrendChart from '../TrendChart/TrendChart';
import { TREND_STEP, getTrendMax, toTrendGroups } from '../TrendChart/trendAdapter';

import styles from './style';

interface Props {
  block: StatsBlock<StatisticsTrend>;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onTouchInside?: () => void;
}

const TrendBlock = ({ block, selectedKey, onSelect, onTouchInside }: Props) => {
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

            {max && <Text style={styles.max}>{`max ${formatMoney(max.amount, trend.currency, { whole: true })}`}</Text>}
          </View>

          <TrendChart
            groups={groups}
            currency={trend.currency}
            selectedKey={selectedKey}
            onSelect={onSelect}
            onTouchInside={onTouchInside}
          />
        </View>
      ) : block.hasError ? (
        <View style={styles.card}>
          <View style={styles.error}>
            <View style={styles.errorIcon}>
              <Icon name="alert" size={19} color={colors.danger} strokeWidth={2} />
            </View>
            <Text style={styles.errorTitle}>Couldn’t load the trend</Text>
            <TouchableOpacity style={styles.retryButton} onPress={block.retry} activeOpacity={0.7}>
              <Icon name="refresh" size={13} color={colors.text} strokeWidth={2.2} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <BlockPlaceholder height={188} />
      )}
    </View>
  );
};

export default TrendBlock;
