import type { ReactElement } from 'react';
import type { ListRenderItem } from 'react-native';
import { FlatList, Text, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { StatisticsSummary, StatisticsTrend } from '@api/dto';
import type { StatsBlock } from '@screens/Stats/hooks/useStatsData';
import type { BreakdownMode, StatsItem } from '@screens/Stats/statsItems';
import BlockPlaceholder from '../BlockPlaceholder/BlockPlaceholder';
import BreakdownHeader from '../BreakdownHeader/BreakdownHeader';
import BreakdownRow from '../BreakdownRow/BreakdownRow';
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
  currencyCode?: string;
  mode: BreakdownMode;
  isOtherExpanded: boolean;
  onModeChange: (mode: BreakdownMode) => void;
  onToggleOther: () => void;
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
  currencyCode,
  mode,
  isOtherExpanded,
  onModeChange,
  onToggleOther,
}: Props) => {
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
            <View style={styles.donut} />
          </View>
        );
      case 'row':
        return (
          <View style={[styles.cardMiddle, item.isLast && styles.cardBottom]}>
            <BreakdownRow
              group={item.group}
              currencyCode={currencyCode}
              isChild={item.isChild}
              isFirst={item.isFirst}
              isOtherExpanded={isOtherExpanded}
              onPress={item.group.kind === 'other' ? onToggleOther : undefined}
            />
          </View>
        );
    }
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      extraData={[isOtherExpanded, summary, trend, selectedTrendKey, showComparison]}
      ListEmptyComponent={placeholder}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default StatsList;
