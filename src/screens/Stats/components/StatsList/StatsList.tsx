import type { ReactElement } from 'react';
import type { ListRenderItem } from 'react-native';
import { FlatList, Text, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { StatisticsSummary, StatisticsTrend } from '@api/dto';
import type { StatsBlock } from '@screens/Stats/hooks/useStatsData';
import type { BreakdownGroup, BreakdownMode, StatsItem } from '@screens/Stats/statsItems';
import BlockPlaceholder from '../BlockPlaceholder/BlockPlaceholder';
import BreakdownHeader from '../BreakdownHeader/BreakdownHeader';
import BreakdownRow from '../BreakdownRow/BreakdownRow';
import DonutChart from '../DonutChart/DonutChart';
import SummaryCards from '../SummaryCards/SummaryCards';
import TrendBlock from '../TrendBlock/TrendBlock';

import styles from './style';

interface Props {
  items: StatsItem[];
  summary: StatsBlock<StatisticsSummary>;
  trend: StatsBlock<StatisticsTrend>;
  selectedTrendKey: string | null;
  onSelectTrend: (key: string | null) => void;
  onTrendTouch: () => void;
  showComparison: boolean;
  // Shown in place of the blocks when the period has nothing to chart.
  placeholder: ReactElement | null;
  mode: BreakdownMode;
  selectedSegmentKey: string | null;
  onSelectSegment: (key: string | null) => void;
  onDonutTouch: () => void;
  isOtherExpanded: boolean;
  onModeChange: (mode: BreakdownMode) => void;
  onToggleOther: () => void;
  onOpenHistory: (group: BreakdownGroup) => void;
}

const StatsList = ({
  items,
  summary,
  trend,
  selectedTrendKey,
  onSelectTrend,
  onTrendTouch,
  showComparison,
  placeholder,
  mode,
  selectedSegmentKey,
  onSelectSegment,
  onDonutTouch,
  isOtherExpanded,
  onModeChange,
  onToggleOther,
  onOpenHistory,
}: Props) => {
  const rowPress = (group: BreakdownGroup) => {
    if (group.kind === 'other') return onToggleOther;
    if (group.kind === 'deleted_wallets') return undefined;
    return () => onOpenHistory(group);
  };

  const renderItem: ListRenderItem<StatsItem> = ({ item }) => {
    switch (item.kind) {
      case 'summary':
        return <SummaryCards block={summary} showComparison={showComparison} />;
      case 'trend':
        return (
          <TrendBlock
            block={trend}
            selectedKey={selectedTrendKey}
            onSelect={onSelectTrend}
            onTouchInside={onTrendTouch}
          />
        );
      case 'breakdownHeader':
        return <BreakdownHeader mode={mode} showModes={item.hasSpending} onModeChange={onModeChange} />;
      case 'breakdownStatus':
        return <BlockPlaceholder height={260} />;
      case 'breakdownEmpty':
        return (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="pie" size={20} color={colors.muted} strokeWidth={1.8} />
            </View>

            <Text style={styles.emptyTitle}>No expenses in this period</Text>
            <Text style={styles.emptyText}>
              The breakdown shows spending only. It appears once an expense is recorded in this period.
            </Text>
          </View>
        );
      case 'donut':
        return (
          <View style={styles.cardTop}>
            <DonutChart
              groups={item.groups}
              totalAmount={item.totalAmount}
              sourceCount={item.sourceCount}
              currency={item.currency}
              mode={mode}
              selectedKey={selectedSegmentKey}
              onSelect={onSelectSegment}
              onTouchInside={onDonutTouch}
            />
          </View>
        );
      case 'row': {
        const isSelected = !item.isChild && item.group.key === selectedSegmentKey;

        return (
          <View style={[styles.cardMiddle, item.isLast && styles.cardBottom]}>
            <BreakdownRow
              group={item.group}
              currency={item.currency}
              isChild={item.isChild}
              isFirst={item.isFirst}
              isOtherExpanded={isOtherExpanded}
              isSelected={isSelected}
              isDimmed={selectedSegmentKey !== null && !isSelected}
              onPress={rowPress(item.group)}
            />
          </View>
        );
      }
    }
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      extraData={[isOtherExpanded, summary, trend, selectedTrendKey, selectedSegmentKey, showComparison]}
      ListEmptyComponent={placeholder}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default StatsList;
